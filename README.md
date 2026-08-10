# Portfolio — Amber Phosphor Terminal

A scroll-driven WebGL portfolio built as a vintage CRT monitor. The 3D scene lives inside the tube; the navigation lives on the chassis.

**Live:** [Portfolio URL](https://rizaldyimanputra.vercel.app/) · **Author:** [Rizaldy Iman Putra](https://www.linkedin.com/in/rizaldy-imanputra-a17b0317a/)

<img width="1464" height="869" alt="Screenshot 2026-08-10 at 1 17 00 PM" src="https://github.com/user-attachments/assets/f6cae8d8-ac9b-4333-b243-537b63b1e7fe" />

---

## Why it's built this way

Three constraints shaped the whole thing.

**The audience is hiring managers, who spend seconds, not minutes.** A 700vh scroll normally buries the contact details. The fix here is diegetic: the CRT is a physical object, and physical objects have a chassis. Name, résumé, email, a position gauge and a skip-to-contact control are fixed hardware — reachable at any scroll position, with no floating nav bar bolted onto the art.

**Glitch effects fight legibility.** So glitch is event-driven, not ambient. It fires when a section boundary is crossed and scales with scroll velocity, then decays within ~300ms. Resting text is never distorted.

**Amber, not green.** P3 amber phosphor is what DEC VT220s and Wyse terminals actually shipped with, chosen at the time for lower eye strain. Matrix green is the costume-shop version of this aesthetic; amber is the researched one, and it reads better at body-copy sizes.

---

## Stack

| | | |
|---|---|---|
| React 19 | UI layer | Owns the DOM overlay and chassis only |
| TypeScript 5.7 | Types | `strict`, `noUncheckedIndexedAccess` |
| Vite 6 | Build | Fast HMR matters when iterating on shaders |
| three.js 0.171 | WebGL | Plain three, no scene-graph abstraction |
| Lenis 1.3 | Smooth scroll | Virtual scroll with consistent trackpad/touch feel |

### Two choices worth explaining

**No react-three-fiber.** R3F's payoff is a declarative scene graph with many independently-stateful components. This scene is the opposite: five acts driven by one scalar, with per-frame buffer mutation (rewriting alpha arrays, retracing 1,400 Lissajous points) and a custom render-target post pass. R3F would add a layer without removing that work, and the CRT effect would mean either fighting `@react-three/postprocessing` or bypassing R3F's render loop entirely. `CRTEngine` is a plain class with zero React imports. If per-project interactive 3D gets added later, R3F becomes worth revisiting.

**Vite, not Next.js.** The usual argument for Next is SSR for crawlability, but this is one route with static text — Vite's `index.html` ships pre-rendered by definition. Meanwhile Next actively fights WebGL: the canvas needs `window`, so it ends up wrapped in `dynamic(..., { ssr: false })`, which disables SSR for the only expensive part of the page. Next would be the right call if this grew per-project routes at `/work/[slug]`.

**Neither choice affects bundle size.** three.js is ~60% of the payload regardless.

---

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/
npm run preview
npm run typecheck
```

Node 18+.

---

## Project structure

```
index.html                    Inline boot loader — markup, CSS and JS
src/
├─ main.tsx                   Entry
├─ config.ts                  ← name, links, projects, skills, scene tuning
├─ types.ts
├─ styles.css                 Design tokens + all layout
├─ components/
│  ├─ App.tsx
│  ├─ Panels.tsx              ← all body copy, as real DOM
│  └─ Strip.tsx               Chassis controls
├─ scroll/
│  ├─ panels.ts               ← scroll timeline, single source of truth
│  └─ useScrollEngine.ts      Lenis + rAF + engine wiring
└─ crt/
   ├─ CRTEngine.ts            three.js scene, five acts
   ├─ shaders.ts              GLSL
   └─ textures.ts             Canvas-generated textures
```

~1,300 lines total.

---

## Architecture

### Scroll progress never enters React state

It changes every frame. A `setState` per frame would re-render the tree 60×/sec for no reason. Progress lives in the rAF closure and is written straight to `style.opacity` and `style.transform` on DOM nodes registered via `registerPanel`.

React re-renders only when the **active section index** changes — about eight times across the entire scroll, used for the `aria-live` region.

### One rAF loop drives both Lenis and three.js

Lenis is constructed with `autoRaf: false`. The single loop calls `lenis.raf(now)` and then `engine.update(...)` in the same frame. Two independent loops would race, and the DOM copy would lag the 3D scene by a frame.

### One timeline, two consumers

`src/scroll/panels.ts` holds the progress ranges. The DOM panels and the 3D acts both key off it, so retiming the experience is a single edit. Sections are labelled with hex offsets (`0x0000`, `0x0060`) rather than `01 / 02 / 03` — a terminal addresses memory, it doesn't number chapters.

### The scene

| Offset | Act | 3D |
|---|---|---|
| `0x0000` | Boot | Point grid, scanned left to right as a memory test |
| `0x0030` | whoami | Lissajous curve — oscilloscopes were CRTs before screens were |
| `0x0060`–`0x00A8` | Projects | Camera flies past angled textured planes |
| `0x00C0` | Stack | Rotating sprite cylinder |
| `0x00F0` | EOF | Contact prompt, hard stop |

The CRT pass renders the scene to a `WebGLRenderTarget` and resolves it through one fullscreen fragment shader: barrel distortion, scanlines, aperture-grille RGB mask, chromatic aberration (scroll-velocity driven), rolling refresh bar, phosphor noise, vignette, and a power-off collapse. Order matters — UV warping happens before sampling, or the mask blurs.

### Boot loader

Inline in `index.html`, not in the bundle. React is ~60KB gzipped; a loader shipped inside it can't paint until that parses, which is exactly the blank screen a loader exists to prevent. Inline markup paints on the first byte.

It dismisses on genuine readiness — first WebGL frame plus `document.fonts.ready` — with a 1400ms floor so it never flashes on a warm cache, a 6000ms ceiling so a bad connection can't trap anyone, and click/keypress to skip.

Scroll is held with `lenis.stop()`, deliberately **not** `overflow: hidden`. Locking layout zeroes `scrollHeight`, which makes Lenis divide by zero and report progress as `1` — the site flashes its final panel during the reveal.

---

## Making it yours

1. `src/config.ts` — name, role, email, links, project titles, skills, scene tuning
2. `src/components/Panels.tsx` — all body copy
3. `src/styles.css` — `:root` design tokens
4. `index.html` — page title, meta description, Open Graph tags, boot loader text
5. `public/` — drop your résumé PDF and point `CONFIG.resumeUrl` at it

### Design tokens

```
--tube      #0B0906   warm tube black (phosphor glass is never pure black)
--amber     #F5B942   P3 amber phosphor
--amber-hi  #FFD98A   phosphor core / bloom
--amber-dim #8C5A1E   decayed amber, secondary text
--case      #2A211A   yellowed bezel plastic
--cyan      #4FD1E0   the one wrong signal — links and chroma split only
```

Type: **IBM Plex Mono** for anything that must be read, **VT323** for boot text and section markers only. The bitmap face is seasoning, not the meal.

---

## Accessibility & performance

- All copy is real DOM over the canvas — crawlable, selectable, screen-readable. The WebGL layer is decoration.
- `prefers-reduced-motion` auto-enables reduced effects, shortens the loader and disables the blinking cursor.
- A **Reduce effects** toggle on the chassis drops DPR to 1 and disables noise, grille and the rolling bar — a real answer to the locked-down corporate laptop.
- rAF is cancelled on `visibilitychange`.
- DPR capped at 1.5; the CRT pass is fill-rate bound, not vertex bound.
- Full `dispose()` on unmount for every geometry, material and texture.

### Bundle (gzipped)

| Chunk | Size |
|---|---|
| three | 116.8 KB |
| react | 60.5 KB |
| lenis | 5.7 KB |
| app | 9.0 KB |
| css | 2.4 KB |
| html (incl. loader) | 3.4 KB |

Manually chunked so HTML, CSS and copy paint while the WebGL chunk streams in behind them.

---

## Known limitations

Listed because they're real, not resolved.

- **No device capability gate.** Low-end Android gets the same scene at lower DPR and will likely stutter. A `WEBGL_debug_renderer_info` check serving a static fallback is the obvious next step.
- **Not profiled.** No frame-time measurements on real low-end hardware yet.
- **Project card textures are procedural**, drawn on canvas. Real screenshots would be more convincing; they should load lazily by camera proximity.
- **Fonts load from Google Fonts** — a render-blocking third-party request. Self-hosting would remove it.
- **`@types/three` must be pinned to match `three`.** They ship separately and drift; a floating range resolves to a much newer version and produces phantom errors.
