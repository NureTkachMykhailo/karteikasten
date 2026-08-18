import { useEffect, useRef } from "react";
import { BOX_LABEL, BOX_COLOR } from "../helpers";

function CountUp({ target }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!target) {
      if (ref.current) ref.current.textContent = "0";
      return;
    }
    let start = null;
    const dur = 500;
    let raf;
    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / dur, 1);
      if (ref.current) ref.current.textContent = Math.round(progress * target);
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return <div ref={ref} className="font-mono text-2xl font-semibold text-paper">0</div>;
}

export function Dashboard({ dueCount, total, streak, boxCounts, onStartReview }) {
  return (
    <div className="animate-fadeUp">
      <h1 className="font-mono text-[11px] tracking-[2px] uppercase text-brass font-semibold mb-3.5">
        Übersicht
      </h1>

      <div className="flex gap-2.5 mb-6">
        <div className="flex-1 bg-ink-3 border border-[#3a3227] rounded-lg py-3 px-2.5 text-center">
          <CountUp target={dueCount} />
          <div className="text-[10px] tracking-wide text-muted uppercase mt-0.5">heute fällig</div>
        </div>
        <div className="flex-1 bg-ink-3 border border-[#3a3227] rounded-lg py-3 px-2.5 text-center">
          <CountUp target={total} />
          <div className="text-[10px] tracking-wide text-muted uppercase mt-0.5">Karten gesamt</div>
        </div>
        <div className="flex-1 bg-ink-3 border border-[#3a3227] rounded-lg py-3 px-2.5 text-center">
          <CountUp target={streak} />
          <div className="text-[10px] tracking-wide text-muted uppercase mt-0.5">Serie (Tage)</div>
        </div>
      </div>

      <h1 className="font-mono text-[11px] tracking-[2px] uppercase text-brass font-semibold mb-3.5">
        Der Karteikasten
      </h1>
      <div className="flex flex-col gap-2 mb-2">
        {[1, 2, 3, 4, 5].map((b) => (
          <div
            key={b}
            className={`flex items-center gap-3 bg-ink-3 border border-[#3a3227] border-l-[5px] ${BOX_COLOR[b].replace(
              "bg-",
              "border-"
            )} rounded-md py-2.5 px-3.5`}
          >
            <div
              className={`w-[26px] h-[26px] rounded-full ${BOX_COLOR[b]} text-ink flex items-center justify-center font-mono font-bold text-[13px] shrink-0`}
            >
              {b}
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-paper">Fach {b}</div>
              <div className="text-[11px] text-muted mt-px">{BOX_LABEL[b]}</div>
            </div>
            <div className="font-mono text-base text-paper font-semibold">{boxCounts[b] || 0}</div>
          </div>
        ))}
      </div>

      <button
        onClick={onStartReview}
        className="w-full mt-4 py-3.5 rounded-md bg-brass text-ink font-mono text-xs font-semibold uppercase tracking-wide
                   active:scale-[.97] transition-transform"
      >
        {dueCount > 0 ? `Wiederholung starten (${dueCount})` : "Nichts fällig — trotzdem üben"}
      </button>
    </div>
  );
}
