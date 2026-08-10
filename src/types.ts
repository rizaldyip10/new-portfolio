export interface Project {
  /** Burned into the WebGL card texture. Keep it short — it renders large. */
  title: string;
  /** Small label in the fake window title bar. */
  tag: string;
  /** Shifts the sparkline so the four cards don't look identical. */
  seed: number;
}

export interface PanelRange {
  /** Scroll progress, 0–1, where this panel starts fading in. */
  a: number;
  /** Scroll progress, 0–1, where it has fully faded out. */
  b: number;
}

export interface ScrollFrame {
  /** Smoothed scroll progress from Lenis, 0–1. */
  progress: number;
  /** Normalised scroll velocity. Drives chromatic aberration. */
  velocity: number;
  /** Seconds since last frame, clamped. */
  dt: number;
}