import type { PanelRange } from "../types";

/**
 * Single source of truth for the scroll timeline. The 3D acts in CRTEngine
 * and the DOM panels both key off these numbers, so a retime is one edit.
 * `addr` is the hex offset shown on the chassis gauge — a terminal addresses
 * memory, it doesn't number chapters.
 */
export interface PanelDef extends PanelRange {
  id: string;
  addr: string;
}

export const PANELS: PanelDef[] = [
  { id: "boot",     addr: "0x0000", a: 0,     b: 0.085 },
  { id: "whoami",   addr: "0x0030", a: 0.085, b: 0.26 },
  { id: "project-1",addr: "0x0060", a: 0.26,  b: 0.38 },
  { id: "project-2",addr: "0x0078", a: 0.38,  b: 0.50 },
  { id: "project-3",addr: "0x0090", a: 0.50,  b: 0.62 },
  { id: "project-4",addr: "0x00A8", a: 0.62,  b: 0.735 },
  { id: "skills",   addr: "0x00C0", a: 0.735, b: 0.875 },
  { id: "contact",  addr: "0x00F0", a: 0.875, b: 1.01 },
];

/** Boundaries that should trigger a glitch burst when crossed. */
export const BOUNDARIES = PANELS.map((p) => p.a).filter((v) => v > 0);

/** Opacity + parallax offset for a panel at a given global progress. */
export function panelState(p: PanelDef, progress: number) {
  const inside = progress >= p.a - 0.012 && progress < p.b + 0.012;
  if (!inside) return { opacity: 0, offset: 0, inside };
  const local = (progress - p.a) / (p.b - p.a);
  const opacity = Math.min(1, Math.min(local, 1 - local) / 0.16 + 0.35);
  return { opacity, offset: (0.5 - local) * 22, inside };
}

export function activePanelIndex(progress: number): number {
  for (let i = PANELS.length - 1; i >= 0; i--) {
    if (progress >= PANELS[i]!.a) return i;
  }
  return 0;
}