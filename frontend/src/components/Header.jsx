const TABS = [
  { id: "dash", label: "Übersicht" },
  { id: "catalog", label: "Katalog" },
  { id: "review", label: "Wiederholen" },
  { id: "add", label: "Neu" },
];

export function Header({ userEmail, onLogout }) {
  return (
    <header className="text-center pt-6 pb-2 animate-fadeIn relative">
      <div className="font-display text-[26px] md:text-4xl tracking-[2px] text-brass drop-shadow-[0_1px_0_rgba(0,0,0,.4)]">
        KARTEIKASTEN
      </div>
      <div className="mt-1 font-mono text-[10px] tracking-[3px] text-muted uppercase">
        Katalog &amp; Wiederholung · Deutsch
      </div>
      {userEmail && (
        <button
          onClick={onLogout}
          className="absolute right-0 top-6 font-mono text-[10px] uppercase tracking-wide text-muted hover:text-cream transition-colors underline"
          title={userEmail}
        >
          Abmelden
        </button>
      )}
    </header>
  );
}

export function Tabs({ active, onChange }) {
  return (
    <>
      <nav className="flex gap-1.5 mt-4 mb-0">
        {TABS.map((t) => (
          <div
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`flex-1 text-center py-2.5 px-1 font-mono text-[11px] tracking-wide uppercase cursor-pointer
                        border border-b-0 rounded-t-md relative top-px transition-colors duration-150
                        ${
                          active === t.id
                            ? "text-ink-text bg-paper border-brass font-semibold"
                            : "text-muted bg-ink-3 border-[#3a3227] hover:text-cream"
                        }`}
          >
            {t.label}
          </div>
        ))}
      </nav>
      <div className="h-0.5 bg-brass -mt-px rounded-sm" />
    </>
  );
}
