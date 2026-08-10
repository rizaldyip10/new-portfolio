import * as THREE from "three";
import type { Project } from "../types";

/** Soft radial phosphor dot. Every Points cloud shares this one texture. */
export function makeDotTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.28, "rgba(255,235,190,0.75)");
  g.addColorStop(1, "rgba(255,200,120,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Procedural "screenshot" for a project card.
 * Replace this with a real <img> load once you have actual screenshots —
 * a recruiter believes a screenshot, not an abstraction of one.
 */
export function makeScreenTexture(p: Project): THREE.Texture {
  const W = 1024;
  const H = 640;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d")!;

  x.fillStyle = "#100B07";
  x.fillRect(0, 0, W, H);

  x.fillStyle = "#1E1610";
  x.fillRect(0, 0, W, 54);
  x.fillStyle = "#8C5A1E";
  for (const cx of [26, 52, 78]) {
    x.beginPath();
    x.arc(cx, 27, 7, 0, Math.PI * 2);
    x.fill();
  }
  x.fillStyle = "#C9B79A";
  x.font = "500 20px 'IBM Plex Mono', monospace";
  x.fillText(p.tag, 112, 34);

  x.font = "16px 'IBM Plex Mono', monospace";
  for (let i = 0; i < 15; i++) {
    const y = 100 + i * 30;
    const indent = (i % 4) * 26;
    x.fillStyle = "#4A3520";
    x.fillText(String(i + 1).padStart(3, " "), 22, y);
    let cx = 70 + indent;
    for (let w = 0; w < 3 + ((i * 7) % 4); w++) {
      const len = 26 + ((i * 13 + w * 29) % 110);
      x.fillStyle = w === 0 ? "#F5B942" : w % 2 ? "#8C5A1E" : "#4FD1E0";
      x.globalAlpha = w === 0 ? 0.9 : 0.45;
      x.fillRect(cx, y - 12, len, 11);
      cx += len + 14;
      if (cx > W - 330) break;
    }
    x.globalAlpha = 1;
  }

  x.strokeStyle = "#2E2318";
  x.strokeRect(W - 300, 96, 264, H - 150);
  x.strokeStyle = "#F5B942";
  x.lineWidth = 2.5;
  x.beginPath();
  for (let i = 0; i <= 52; i++) {
    const px = W - 286 + i * 4.8;
    const py = H - 120 - Math.abs(Math.sin(i * 0.29 + p.seed)) * (160 + p.seed * 3);
    if (i) {
      x.lineTo(px, py);
    } else {
      x.moveTo(px, py);
    }
  }
  x.stroke();

  x.fillStyle = "#FFD98A";
  x.font = "400 62px 'VT323', 'IBM Plex Mono', monospace";
  x.fillText(p.title, 30, H - 34);

  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A single skill name, drawn as an additive sprite. */
export function makeLabelTexture(label: string): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const x = c.getContext("2d")!;
  x.fillStyle = "#FFD98A";
  x.font = "400 78px 'VT323', 'IBM Plex Mono', monospace";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(label, 256, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}