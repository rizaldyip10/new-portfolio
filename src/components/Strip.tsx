import type React from "react";
import { CONFIG } from "../config";
import type { ScrollEngineHandles } from "../scroll/UseScrollEngine";

/**
 * Fixed hardware. This is the whole answer to "recruiters bounce from long
 * scrolls" — name, résumé and email are chassis, not content, so they are
 * reachable at any scroll position without a floating nav bar.
 */
export function Strip({ engine }: { engine: ScrollEngineHandles }) {
  const { fillRef, addrRef, lowFx, setLowFx, powerOn, togglePower, scrollToEnd } = engine;

  return (
    <div className="strip">
      <div className="nameplate">
        <b>{CONFIG.name}</b>
        <span>{CONFIG.role}</span>
      </div>

      <button
        className="btn power"
        onClick={togglePower}
        aria-pressed={!powerOn}
        aria-label={powerOn ? "Turn screen off" : "Turn screen on"}
      >
        ⏻
      </button>

      <div className="gauge">
        <div className="track">
          <div className="fill" ref={fillRef} />
        </div>
        <output className="addr" ref={addrRef as React.Ref<HTMLOutputElement>} aria-label="Scroll position">
          0x0000
        </output>
      </div>

      <div className="actions">
        <button className="btn" onClick={scrollToEnd}>
          Skip to contact
        </button>
        <button className="btn" onClick={() => setLowFx(!lowFx)} aria-pressed={lowFx}>
          {lowFx ? "Full effects" : "Reduce effects"}
        </button>
        <a className="btn primary" href={CONFIG.resumeUrl}>
          Résumé
        </a>
        <a className="btn primary" href={`mailto:${CONFIG.email}`}>
          Email
        </a>
      </div>
    </div>
  );
}