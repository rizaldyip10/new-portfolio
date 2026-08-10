import * as THREE from "three";
import { CONFIG, SCENE } from "../config";
import type { ScrollFrame } from "../types";
import { GLOW_FRAG, GLOW_VERT, POST_FRAG, POST_VERT } from "./shaders";
import { makeDotTexture, makeLabelTexture, makeScreenTexture } from "./textures";

const AMBER = 0xf5b942;
const AMBER_HI = 0xffd98a;
const GRID_W = 52;
const GRID_H = 26;
const LISS_POINTS = 1400;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Owns the WebGL side entirely. React never touches this; it hands over a
 * canvas on mount and a ScrollFrame each tick, and calls dispose() on unmount.
 * Keeping it framework-free means it stays portable if you ever drop React.
 */
export class CRTEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(58, 1, 0.1, 900);

  private postScene = new THREE.Scene();
  private postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private rt: THREE.WebGLRenderTarget;
  private post: THREE.ShaderMaterial;

  private dot: THREE.Texture;
  private memGeo = new THREE.BufferGeometry();
  private lissGeo = new THREE.BufferGeometry();
  private liss: THREE.Points;
  private cards: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  private stack = new THREE.Group();

  private disposables: { dispose(): void }[] = [];
  private glitch = 0;
  private power = 1;
  private lowFx = false;
  private lastProgress = 0;
  private time = 0;

  /** Progress values that trigger a glitch burst when crossed. */
  private boundaries: number[] = [];

  constructor(canvas: HTMLCanvasElement, boundaries: number[]) {
    this.boundaries = boundaries;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    this.renderer.setClearColor(0x0b0906, 1);
    this.rt = new THREE.WebGLRenderTarget(2, 2, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });

    this.dot = makeDotTexture();
    this.disposables.push(this.dot);

    this.buildMemoryGrid();
    this.liss = this.buildLissajous();
    this.buildCards();
    this.buildStack();

    this.post = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: this.rt.texture },
        uRes: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uVel: { value: 0 },
        uGlitch: { value: 0 },
        uPower: { value: 1 },
        uLow: { value: 0 },
      },
      vertexShader: POST_VERT,
      fragmentShader: POST_FRAG,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.post);
    this.postScene.add(quad);
    this.disposables.push(quad.geometry, this.post);
  }

  /** World Z for content that should sit `lead` units ahead of the camera at `p`. */
  private zAt(p: number, lead = SCENE.lead): number {
    return 20 - p * SCENE.depth - lead;
  }

  private glowMaterial(size: number, color: number): THREE.ShaderMaterial {
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: this.dot },
        uSize: { value: size },
        uColor: { value: new THREE.Color(color) },
      },
      vertexShader: GLOW_VERT,
      fragmentShader: GLOW_FRAG,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.disposables.push(m);
    return m;
  }

  // ── ACT 1 · memory test ────────────────────────────────────────────
  private buildMemoryGrid(): void {
    const n = GRID_W * GRID_H;
    const pos = new Float32Array(n * 3);
    const alpha = new Float32Array(n);
    let i = 0;
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        pos[i * 3] = (x - GRID_W / 2) * 1.5;
        pos[i * 3 + 1] = (y - GRID_H / 2) * 1.5;
        pos[i * 3 + 2] = 0;
        alpha[i] = 0;
        i++;
      }
    }
    this.memGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.memGeo.setAttribute("alpha", new THREE.BufferAttribute(alpha, 1));
    const pts = new THREE.Points(this.memGeo, this.glowMaterial(9, AMBER));
    pts.position.z = this.zAt(0.02);
    this.scene.add(pts);
    this.disposables.push(this.memGeo);
  }

  // ── ACT 2 · oscilloscope trace. CRTs were scopes before they were screens.
  private buildLissajous(): THREE.Points {
    this.lissGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(LISS_POINTS * 3), 3)
    );
    this.lissGeo.setAttribute(
      "alpha",
      new THREE.BufferAttribute(new Float32Array(LISS_POINTS).fill(1), 1)
    );
    const pts = new THREE.Points(this.lissGeo, this.glowMaterial(5.5, AMBER_HI));
    pts.position.set(
      SCENE.whoamiOffset.x,
      SCENE.whoamiOffset.y,
      this.zAt(SCENE.whoamiAnchor)
    );
    this.scene.add(pts);
    this.disposables.push(this.lissGeo);
    return pts;
  }

  private traceLissajous(t: number, morph: number): void {
    const pos = this.lissGeo.attributes.position!.array as Float32Array;
    const alpha = this.lissGeo.attributes.alpha!.array as Float32Array;
    const a = 3 + morph * 2;
    const b = 4 - morph * 1.6;
    const drift = t * 0.22;
    for (let i = 0; i < LISS_POINTS; i++) {
      const u = (i / LISS_POINTS) * Math.PI * 2;
      pos[i * 3] = Math.sin(a * u + drift) * 13;
      pos[i * 3 + 1] = Math.sin(b * u) * 9;
      pos[i * 3 + 2] = Math.sin(((a + b) * 0.5) * u - drift) * 5;
      // Beam is brightest where it most recently passed.
      alpha[i] = (0.35 + 0.65 * Math.sqrt(i / LISS_POINTS)) * SCENE.whoamiBeam;
    }
    this.lissGeo.attributes.position!.needsUpdate = true;
    this.lissGeo.attributes.alpha!.needsUpdate = true;
  }

  // ── ACT 3 · project cards ──────────────────────────────────────────
  private buildCards(): void {
    CONFIG.projects.forEach((p, i) => {
      const geo = new THREE.PlaneGeometry(30, 18.75);
      const tex = makeScreenTexture(p);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0 });
      const mesh = new THREE.Mesh(geo, mat);
      const anchor = SCENE.projectAnchors[i] ?? 0.5;
      const odd = i % 2 === 1;
      mesh.position.set(odd ? 9 : -9, odd ? -2 : 2.5, this.zAt(anchor));
      mesh.rotation.y = (odd ? -1 : 1) * 0.3;
      mesh.rotation.z = (odd ? 1 : -1) * 0.018;
      this.scene.add(mesh);
      this.cards.push(mesh);
      this.disposables.push(geo, mat, tex);
    });
  }

  // ── ACT 4 · stack cylinder ─────────────────────────────────────────
  private buildStack(): void {
    this.stack.position.z = this.zAt(SCENE.stackAnchor);
    this.scene.add(this.stack);
    const n = CONFIG.skills.length;
    CONFIG.skills.forEach((label, i) => {
      const tex = makeLabelTexture(label);
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      const angle = (i / n) * Math.PI * 2;
      sprite.position.set(Math.cos(angle) * 15, ((i % 4) - 1.5) * 4.6, Math.sin(angle) * 15);
      sprite.scale.set(11, 2.75, 1);
      this.stack.add(sprite);
      this.disposables.push(mat, tex);
    });
  }

  // ── PUBLIC API ─────────────────────────────────────────────────────
  resize(width: number, height: number): void {
    const dpr = Math.min(
      window.devicePixelRatio,
      this.lowFx ? SCENE.maxDprLowFx : SCENE.maxDpr
    );
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);
    this.rt.setSize(width * dpr, height * dpr);
    this.camera.aspect = width / height;
    const narrow = width < 780;
    this.camera.fov = narrow ? 74 : 58;
    this.camera.updateProjectionMatrix();

    // Portrait can't dodge sideways — lift the trace above the copy and
    // shrink it, so the text block below stays on clean tube.
    const off = narrow ? SCENE.whoamiOffsetNarrow : SCENE.whoamiOffset;
    this.liss.position.x = off.x;
    this.liss.position.y = off.y;
    this.liss.scale.setScalar(narrow ? 0.6 : 1);
    (this.post.uniforms.uRes!.value as THREE.Vector2).set(width * dpr, height * dpr);
  }

  setLowFx(low: boolean): void {
    this.lowFx = low;
    this.post.uniforms.uLow!.value = low ? 1 : 0;
  }

  setPower(v: number): void {
    this.power = v;
  }

  update({ progress, velocity, dt }: ScrollFrame): void {
    this.time += dt;

    // Glitch: fires when a section boundary is crossed, plus a velocity
    // floor. Decays fast so resting text is never distorted.
    const crossed = this.boundaries.some(
      (b) =>
        (this.lastProgress < b && progress >= b) ||
        (this.lastProgress > b && progress <= b)
    );
    if (crossed) this.glitch = 1;
    this.glitch = Math.max(this.glitch - dt * 3.2, Math.min(0.55, Math.abs(velocity) * 1.5));
    if (this.lowFx) this.glitch = Math.min(this.glitch, 0.12);
    this.lastProgress = progress;

    this.camera.position.z = 20 - progress * SCENE.depth;
    this.camera.position.x = Math.sin(progress * 7) * 1.2;
    this.camera.rotation.y = -this.camera.position.x * 0.012;

    // Act 1 — memory fills left to right, with a bright leading edge.
    const memAlpha = this.memGeo.attributes.alpha!.array as Float32Array;
    const fillTo = Math.min(1, progress / 0.075) * memAlpha.length;
    for (let i = 0; i < memAlpha.length; i++) {
      memAlpha[i] = i < fillTo ? (i > fillTo - 70 ? 1 : 0.3) : 0;
    }
    this.memGeo.attributes.alpha!.needsUpdate = true;

    // Act 2
    this.traceLissajous(this.time, clamp01((progress - 0.085) / 0.175));
    this.liss.rotation.z = progress * 1.5;

    // Act 3 — opacity by camera proximity, so cards never pop.
    this.cards.forEach((card, i) => {
      const d = Math.abs(this.camera.position.z - card.position.z);
      card.material.opacity = clamp01(1 - (d - 14) / 46);
      card.rotation.y += Math.sin(this.time + i) * 0.00035;
    });

    // Act 4
    const stackFade =
      clamp01((progress - 0.72) / 0.09) * (1 - clamp01((progress - 0.88) / 0.06));
    this.stack.rotation.y = progress * 4.2;
    this.stack.children.forEach((c: THREE.Object3D) => {
      (c as THREE.Sprite).material.opacity = stackFade * 0.95;
    });

    this.post.uniforms.uTime!.value = this.time;
    this.post.uniforms.uVel!.value = velocity;
    this.post.uniforms.uGlitch!.value = this.glitch;
    this.post.uniforms.uPower!.value = this.power;

    this.renderer.setRenderTarget(this.rt);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.postScene, this.postCamera);
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
    this.rt.dispose();
    this.renderer.dispose();
  }
}