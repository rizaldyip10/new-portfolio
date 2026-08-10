import Lenis from "lenis";
import { useEffect, useRef, useState } from "react";
import { CRTEngine } from "../crt/CRTEngine";
import { SCENE } from "../config";
import { BOUNDARIES, PANELS, activePanelIndex, panelState } from "./panels";

export interface ScrollEngineHandles {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  tubeRef: React.RefObject<HTMLDivElement | null>;
  /** Register a panel element so the frame loop can drive it without re-rendering. */
  registerPanel: (id: string, el: HTMLElement | null) => void;
  fillRef: React.RefObject<HTMLDivElement | null>;
  addrRef: React.RefObject<HTMLElement | null>;
  /** Discrete — safe to render. Changes ~8 times across the whole scroll. */
  activeIndex: number;
  lowFx: boolean;
  setLowFx: (v: boolean) => void;
  powerOn: boolean;
  togglePower: () => void;
  scrollToEnd: () => void;
}

/**
 * The whole animation system. Two rules make this fast:
 *
 *   1. Scroll progress NEVER enters React state. It changes every frame; a
 *      setState per frame would re-render the tree 60x/sec. It lives in a ref
 *      and is written straight to `style.opacity` on registered DOM nodes.
 *   2. One rAF loop drives Lenis AND three.js. Two loops would race and you'd
 *      get a frame of scroll lag between the text and the scene.
 */
export function useScrollEngine(): ScrollEngineHandles {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tubeRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const addrRef = useRef<HTMLElement | null>(null);
  const panelEls = useRef(new Map<string, HTMLElement>());

  const engineRef = useRef<CRTEngine | null>(null);
  const powerRef = useRef(1);
  const powerAnim = useRef<number | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [powerOn, setPowerOn] = useState(true);
  const [lowFx, setLowFxState] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const registerPanel = (id: string, el: HTMLElement | null) => {
    if (el) panelEls.current.set(id, el);
    else panelEls.current.delete(id);
  };

  const setLowFx = (v: boolean) => {
    setLowFxState(v);
    engineRef.current?.setLowFx(v);
    const tube = tubeRef.current;
    if (tube) engineRef.current?.resize(tube.clientWidth, tube.clientHeight);
  };

  const togglePower = () => {
    if (powerAnim.current !== null) return;
    const goingOff = powerOn;
    setPowerOn(!goingOff);
    const dur = goingOff ? 420 : 700;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      powerRef.current = goingOff ? 1 - k : k;
      if (k < 1) {
        powerAnim.current = requestAnimationFrame(step);
      } else {
        powerRef.current = goingOff ? 0 : 1;
        powerAnim.current = null;
      }
    };
    powerAnim.current = requestAnimationFrame(step);
  };

  const lenisRef = useRef<Lenis | null>(null);
  const scrollToEnd = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    lenisRef.current?.scrollTo(max, { duration: lowFx ? 0 : 1.4 });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const tube = tubeRef.current;
    if (!canvas || !tube) return;

    const engine = new CRTEngine(canvas, BOUNDARIES);
    engineRef.current = engine;
    engine.setLowFx(lowFx);

    // autoRaf false — we drive Lenis ourselves so it stays in lockstep
    // with the WebGL update inside a single frame.
    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.09,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.6,
    });
    lenisRef.current = lenis;

    const ro = new ResizeObserver(() => engine.resize(tube.clientWidth, tube.clientHeight));
    ro.observe(tube);
    engine.resize(tube.clientWidth, tube.clientHeight);

    let raf = 0;
    let last = performance.now();
    let lastActive = -1;
    let firstFrameDone = false;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      lenis.raf(now);
      const progress = Math.min(1, Math.max(0, lenis.progress || 0));
      const velocity = (lenis.velocity || 0) * SCENE.velocityScale;

      engine.setPower(powerRef.current);
      engine.update({ progress, velocity, dt });

      // Tell the inline loader the scene is genuinely on screen. Waiting for
      // fonts too, because the panels are typographic — revealing before
      // VT323 lands would show a flash of fallback type.
      if (!firstFrameDone) {
        firstFrameDone = true;
        const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
        const ready = fonts ? fonts.ready.catch(() => undefined) : Promise.resolve();
        void ready.then(() => (window as Window & { __crtReady?: () => void }).__crtReady?.());
      }

      // Imperative DOM writes. No React render involved.
      for (const p of PANELS) {
        const el = panelEls.current.get(p.id);
        if (!el) continue;
        const s = panelState(p, progress);
        el.style.opacity = s.opacity.toFixed(3);
        el.style.visibility = s.opacity > 0.01 ? "visible" : "hidden";
        el.style.transform = s.inside ? `translateY(${s.offset.toFixed(1)}px)` : "";
      }
      if (fillRef.current) fillRef.current.style.right = `${((1 - progress) * 100).toFixed(2)}%`;
      if (addrRef.current) {
        addrRef.current.textContent =
          "0x" + Math.round(progress * 256).toString(16).toUpperCase().padStart(4, "0");
      }

      // The one thing React is told about: which section we're in.
      const idx = activePanelIndex(progress);
      if (idx !== lastActive) {
        lastActive = idx;
        setActiveIndex(idx);
      }
    };
    raf = requestAnimationFrame(frame);

    // The loader locks overflow while it's up; Lenis must remeasure after.
    const onBooted = () => lenis.resize();
    window.addEventListener("crt:booted", onBooted);

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      if (powerAnim.current !== null) cancelAnimationFrame(powerAnim.current);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("crt:booted", onBooted);
      ro.disconnect();
      lenis.destroy();
      engine.dispose();
      engineRef.current = null;
      lenisRef.current = null;
    };
    // Engine is built once. lowFx changes are pushed imperatively via setLowFx.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    canvasRef, tubeRef, registerPanel, fillRef, addrRef,
    activeIndex, lowFx, setLowFx, powerOn, togglePower, scrollToEnd,
  };
}