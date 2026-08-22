import { BOX_COLOR } from "../helpers";
import { useLang } from "../LangContext";

const TYPES = ["Wort", "Verb", "Phrase", "Grammatik"];

export function Catalog({ cards, search, onSearch, filterType, onFilterType, onEdit, onDelete }) {
  const { t } = useLang();
  const list = cards
    .filter((c) => {
      const q = search.trim().toLowerCase();
      const matchesQ =
        !q ||
        c.front.toLowerCase().includes(q) ||
        c.back.toLowerCase().includes(q) ||
        (c.tags || []).some((tag) => tag.toLowerCase().includes(q));
      const matchesType = !filterType || c.type === filterType;
      return matchesQ && matchesType;
    })
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  return (
    <div className="animate-fadeUp">
      <h1 className="font-mono text-[11px] tracking-[2px] uppercase text-brass font-semibold mb-3.5">
        {t("catalogTitle", cards.length)}
      </h1>

      <input
        className="w-full px-3 py-2.5 mb-3 rounded-md border border-[#3a3227] bg-ink-3 text-cream text-sm placeholder:text-muted"
        placeholder={t("searchPlaceholder")}
        value={search}
        onChange={(e) => onSearch(e.target.value)}
      />

      <div className="flex gap-1.5 mb-4 flex-wrap">
        {TYPES.map((ty) => (
          <div
            key={ty}
            onClick={() => onFilterType(filterType === ty ? null : ty)}
            className={`font-mono text-[10px] tracking-wide uppercase px-2.5 py-1 rounded-full border cursor-pointer transition-all active:scale-[.95]
                        ${
                          filterType === ty
                            ? "bg-brass text-ink border-brass font-semibold"
                            : "text-muted border-[#3a3227] hover:text-cream hover:border-brass"
                        }`}
          >
            {ty}
          </div>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="text-center py-10 px-5 text-muted">
          <div className="font-display text-[15px] text-paper mb-1.5">{t("noCardsFound")}</div>
          {t("noCardsHint")}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-2.5">
          {list.map((c) => (
            <div
              key={c.id}
              className={`bg-paper text-ink-text rounded-[4px] py-3 px-4 pl-4 relative border-l-[6px]
                          ${BOX_COLOR[c.box].replace("bg-", "border-")}
                          shadow-[0_2px_4px_rgba(0,0,0,.25)] transition-transform duration-150
                          hover:-translate-y-0.5 hover:shadow-[0_6px_14px_rgba(0,0,0,.3)]`}
            >
              <div className="absolute top-2 right-2.5 flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ink opacity-15 block" />
                <span className="w-1.5 h-1.5 rounded-full bg-ink opacity-15 block" />
              </div>
              <div className="font-display text-lg">{c.front}</div>
              <div className="text-sm text-[#544a3a] mt-1">{c.back}</div>
              <div className="flex gap-2 mt-2 flex-wrap items-center">
                <span className="font-mono text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-paper-2 text-[#544a3a] border border-paper-line">
                  {c.type}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-paper-2 text-[#544a3a] border border-paper-line">
                  {c.level}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-paper-2 text-[#544a3a] border border-paper-line">
                  {t("box")} {c.box}
                </span>
                <div className="ml-auto flex gap-2.5">
                  <a onClick={() => onEdit(c.id)} className="font-mono text-[11px] text-brass-dark hover:text-stamp cursor-pointer underline transition-colors">
                    {t("edit")}
                  </a>
                  <a onClick={() => onDelete(c.id)} className="font-mono text-[11px] text-brass-dark hover:text-stamp cursor-pointer underline transition-colors">
                    {t("delete")}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
