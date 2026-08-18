import { useEffect, useState } from "react";
import { BOX_BORDER } from "../helpers";
import { LoaderDots } from "./UI";

function DialoguePanel({ de, en }) {
  if (!de) return null;
  return (
    <div className="bg-paper text-ink-text rounded-lg p-4.5 mt-3.5 animate-fadeUp">
      <div className="font-mono text-[10px] tracking-[1.5px] uppercase text-brass-dark mb-2">Dialog</div>
      <div className="font-display text-sm whitespace-pre-wrap leading-7">{de}</div>
      <div className="border-t border-dashed border-paper-line my-4" />
      <div className="font-mono text-[10px] tracking-[1.5px] uppercase text-brass-dark mb-2">Übersetzung</div>
      <div className="font-display text-[13px] whitespace-pre-wrap leading-7 text-[#6b6050]">{en}</div>
    </div>
  );
}

function AiDialogueBox({ busy, onGenerate }) {
  return (
    <div className={`bg-ink-3 border rounded-lg p-3 mt-4.5 ${busy ? "border-solid border-brass-dark ai-box-busy" : "border-dashed border-brass"}`}>
      <div className="font-mono text-[10px] tracking-wide uppercase text-brass mb-2">
        KI: Dialog aus den fälligen Wörtern generieren
      </div>
      <button
        onClick={onGenerate}
        disabled={busy}
        className="w-full py-2 rounded-md border border-[#3a3227] text-cream font-mono text-[10px] uppercase tracking-wide
                   disabled:opacity-50 active:scale-[.97] transition-transform"
      >
        {busy ? <LoaderDots /> : "Dialog generieren"}
      </button>
    </div>
  );
}

export function Review({ dueCards, allCards, aiGenerating, dialogueDe, dialogueEn, onGenerateDialogue, onRate }) {
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => setFlipped(false), [index]);

  function start(pool) {
    setQueue([...pool].sort(() => Math.random() - 0.5));
    setIndex(0);
  }

  async function rate(rating) {
    const card = queue[index];
    await onRate(card.id, rating);
    setIndex((i) => i + 1);
  }

  const inSession = queue.length > 0 && index < queue.length;

  if (!inSession) {
    return (
      <div className="animate-fadeUp">
        <h1 className="font-mono text-[11px] tracking-[2px] uppercase text-brass font-semibold mb-3.5">
          Wiederholen
        </h1>
        {dueCards.length === 0 ? (
          <>
            <div className="text-center py-10 px-5 text-muted">
              <div className="font-display text-[15px] text-paper mb-1.5">Für heute nichts fällig</div>
              Alle Karten sind aktuell. Du kannst trotzdem eine freie Runde üben.
            </div>
            <button
              onClick={() => start(allCards)}
              className="w-full py-3 rounded-md border border-[#3a3227] text-cream font-mono text-xs uppercase tracking-wide
                         active:scale-[.97] transition-transform"
            >
              Freie Übungsrunde (alle Karten)
            </button>
          </>
        ) : (
          <>
            <div className="text-center py-10 px-5 text-muted">
              <div className="font-display text-[15px] text-paper mb-1.5">
                {dueCards.length} Karte{dueCards.length === 1 ? "" : "n"} heute fällig
              </div>
              Tippe auf die Karte, um die Rückseite zu zeigen, dann bewerte dich selbst.
            </div>
            <button
              onClick={() => start(dueCards)}
              className="w-full py-3.5 rounded-md bg-brass text-ink font-mono text-xs font-semibold uppercase tracking-wide
                         active:scale-[.97] transition-transform"
            >
              Runde starten
            </button>
          </>
        )}
        <AiDialogueBox busy={aiGenerating} onGenerate={onGenerateDialogue} />
        <DialoguePanel de={dialogueDe} en={dialogueEn} />
      </div>
    );
  }

  const card = queue[index];
  const border = BOX_BORDER[card.box];

  return (
    <div className="animate-fadeUp">
      <div className="font-mono text-[11px] text-muted text-center mb-3.5">
        Karte {index + 1} / {queue.length}
      </div>
      <div className="flip-scene">
        <div className={`flip-card ${flipped ? "flipped" : ""}`} onClick={() => setFlipped(true)}>
          <div className={`flip-face front bg-paper text-ink-text rounded-lg py-7.5 px-6 shadow-[0_6px_18px_rgba(0,0,0,.35)] flex flex-col justify-center border-t-[5px] ${border}`}>
            <div className="absolute top-3 left-0 right-0 flex justify-center gap-6">
              <span className="w-2.5 h-2.5 rounded-full bg-ink opacity-[.18]" />
              <span className="w-2.5 h-2.5 rounded-full bg-ink opacity-[.18]" />
            </div>
            <div className="font-mono text-[10px] tracking-wide uppercase text-muted mb-4 text-center">
              {card.type} · {card.level} · Fach {card.box}
            </div>
            <div className="font-display text-[28px] text-center leading-snug">{card.front}</div>
            <div className="font-mono text-[10px] text-muted text-center mt-5.5 tracking-wide uppercase">
              antippen, um die Antwort zu zeigen
            </div>
          </div>
          <div className={`flip-face back bg-paper text-ink-text rounded-lg py-7.5 px-6 shadow-[0_6px_18px_rgba(0,0,0,.35)] flex flex-col justify-center border-t-[5px] ${border}`}>
            <div className="absolute top-3 left-0 right-0 flex justify-center gap-6">
              <span className="w-2.5 h-2.5 rounded-full bg-ink opacity-[.18]" />
              <span className="w-2.5 h-2.5 rounded-full bg-ink opacity-[.18]" />
            </div>
            <div className="text-xl font-semibold text-center">{card.back}</div>
            {card.example && (
              <div className="font-display text-[15px] mt-3.5 text-[#544a3a]">„{card.example}"</div>
            )}
            {card.note && <div className="text-[13px] mt-2 text-[#6b6050]">{card.note}</div>}
          </div>
        </div>
      </div>
      {flipped && (
        <div className="flex gap-2.5 mt-4">
          <button
            onClick={() => rate("again")}
            className="flex-1 py-3 rounded-md bg-stamp text-paper font-mono text-xs font-semibold uppercase tracking-wide active:scale-[.97] transition-transform"
          >
            Nochmal
          </button>
          <button
            onClick={() => rate("good")}
            className="flex-1 py-3 rounded-md border border-[#3a3227] text-paper font-mono text-xs font-semibold uppercase tracking-wide active:scale-[.97] transition-transform"
          >
            Kannte ich
          </button>
          <button
            onClick={() => rate("easy")}
            className="flex-1 py-3 rounded-md bg-brass text-ink font-mono text-xs font-semibold uppercase tracking-wide active:scale-[.97] transition-transform"
          >
            Einfach
          </button>
        </div>
      )}
    </div>
  );
}
