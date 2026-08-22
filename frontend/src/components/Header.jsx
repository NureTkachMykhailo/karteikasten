import { useState } from "react";
import { useLang } from "../LangContext";

export function Header({ userEmail, onLogout }) {
  const { t, lang, setLang } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="text-center pt-6 pb-2 animate-fadeIn relative">
      <div className="font-display text-[26px] md:text-4xl tracking-[2px] text-brass drop-shadow-[0_1px_0_rgba(0,0,0,.4)]">
        {t("appName")}
      </div>
      <div className="mt-1 font-mono text-[10px] tracking-[3px] text-muted uppercase">{t("tagline")}</div>

      <div className="absolute right-0 top-5 flex items-center gap-3">
        <div className="flex font-mono text-[10px] uppercase tracking-wide border border-[#3a3227] rounded-full overflow-hidden">
          {["de", "en"].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2 py-1 transition-colors ${
                lang === l ? "bg-brass text-ink font-semibold" : "text-muted hover:text-cream"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {userEmail && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-7 h-7 rounded-full bg-ink-3 border border-[#3a3227] text-brass font-mono text-xs font-semibold
                         flex items-center justify-center hover:border-brass transition-colors"
              title={userEmail}
            >
              {userEmail[0].toUpperCase()}
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-9 z-20 w-56 bg-ink-3 border border-[#3a3227] rounded-lg shadow-lg p-3 text-left animate-fadeUp">
                  <div className="font-mono text-[9px] uppercase tracking-wide text-muted mb-1">
                    {t("loggedInAs")}
                  </div>
                  <div className="text-sm text-paper break-all mb-3">{userEmail}</div>
                  <button
                    onClick={onLogout}
                    className="w-full py-2 rounded-md border border-[#3a3227] text-cream font-mono text-[10px] uppercase tracking-wide
                               hover:border-stamp hover:text-stamp transition-colors"
                  >
                    {t("signOut")}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export function Tabs({ active, onChange }) {
  const { t } = useLang();
  const TABS = [
    { id: "dash", label: t("tabDash") },
    { id: "catalog", label: t("tabCatalog") },
    { id: "review", label: t("tabReview") },
    { id: "add", label: t("tabAdd") },
  ];

  return (
    <nav className="flex gap-1.5 mt-4 border-b border-[#3a3227]">
      {TABS.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 text-center py-2.5 px-1 -mb-px font-mono text-[11px] tracking-wide uppercase cursor-pointer
                      border rounded-t-md transition-all duration-150 active:scale-[.97]
                      ${
                        active === tab.id
                          ? "text-ink-text bg-paper border-brass border-b-paper font-semibold"
                          : "text-muted bg-ink-3 border-[#3a3227] border-b-[#3a3227] hover:text-cream hover:bg-ink-2"
                      }`}
        >
          {tab.label}
        </div>
      ))}
    </nav>
  );
}
