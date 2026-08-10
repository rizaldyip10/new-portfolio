/// <reference types="vite/client" />

declare global {
  interface Window {
    /** Defined by the inline loader in index.html. Called once the WebGL
     *  scene has drawn a real frame, so the loader dismisses on genuine
     *  readiness rather than a timer. Deleted after the loader is removed. */
    __crtReady?: (() => void) | null;
  }
}

export {};