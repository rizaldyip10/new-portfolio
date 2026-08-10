import { SCENE } from "../config";
import { PANELS } from "../scroll/panels";
import { useScrollEngine } from "../scroll/UseScrollEngine";
import { Panels } from "./Panels";
import { Strip } from "./Strip";

export default function App() {
  const engine = useScrollEngine();
  const active = PANELS[engine.activeIndex];

  return (
    <>
      {/* Gives the document its scrollable height. Lenis reads this. */}
      <div className="scroller" style={{ height: `${SCENE.scrollVh}vh` }} aria-hidden />

      {/* Announced to screen readers when the section changes, and only then. */}
      <div className="sr-only" role="status" aria-live="polite">
        {active ? `Section ${active.id}` : ""}
      </div>

      <div className="chassis">
        <div className="tube" ref={engine.tubeRef}>
          <canvas className="gl" ref={engine.canvasRef} aria-hidden />
          <div style={{ opacity: engine.powerOn ? 1 : 0, transition: "opacity .2s" }}>
            <Panels register={engine.registerPanel} />
          </div>
        </div>
        <Strip engine={engine} />
      </div>
    </>
  );
}