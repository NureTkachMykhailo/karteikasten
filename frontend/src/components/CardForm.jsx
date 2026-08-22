import { useEffect, useState } from "react";
import { api } from "../api";
import { useLang } from "../LangContext";
import { LoaderDots } from "./UI";

const TYPES = ["Wort", "Verb", "Phrase", "Grammatik"];
const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

const emptyForm = { front: "", back: "", example: "", note: "", type: "Wort", level: "A1", tags: "" };

export function CardForm({ editingCard, onSaved, onCancel, showToast }) {
  const { t } = useLang();
  const [form, setForm] = useState(emptyForm);
  const [topic, setTopic] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [rejectReason, setRejectReason] = useState(null);
  const [flashFields, setFlashFields] = useState(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingCard) {
      setForm({
        front: editingCard.front,
        back: editingCard.back,
        example: editingCard.example || "",
        note: editingCard.note || "",
        type: editingCard.type,
        level: editingCard.level,
        tags: (editingCard.tags || []).join(", "),
      });
    } else {
      setForm(emptyForm);
    }
    setDuplicateWarning(null);
    setRejectReason(null);
  }, [editingCard]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function generate() {
    if (!topic.trim()) {
      showToast(t("enterTopic"));
      return;
    }
    setAiGenerating(true);
    setDuplicateWarning(null);
    setRejectReason(null);
    try {
      const res = await api("/ai/generate-card", { method: "POST", body: JSON.stringify({ topic: topic.trim() }) });
      if (res.rejected) {
        setRejectReason(res.rejection_reason || t("rejectFallback"));
        setAiGenerating(false);
        return;
      }
      const d = res.draft;
      setForm({
        front: d.front || "",
        back: d.back || "",
        example: d.example || "",
        note: d.note || "",
        type: d.type || "Wort",
        level: d.level || "A1",
        tags: form.tags,
      });
      if (res.possible_duplicate && res.similar_cards[0]) {
        setDuplicateWarning(res.similar_cards[0].front);
      }
      const fields = ["front", "back", "example", "note"];
      setFlashFields(new Set(fields));
      setTimeout(() => setFlashFields(new Set()), 1000);
    } catch (err) {
      showToast(`${t("aiError")}: ${err.message}`);
    }
    setAiGenerating(false);
  }

  async function save() {
    if (!form.front.trim() || !form.back.trim()) {
      showToast(t("frontBackRequired"));
      return;
    }
    const payload = {
      front: form.front.trim(),
      back: form.back.trim(),
      example: form.example.trim(),
      note: form.note.trim(),
      type: form.type,
      level: form.level,
      tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
    };
    setSaving(true);
    try {
      if (editingCard) {
        const updated = await api(`/cards/${editingCard.id}`, { method: "PUT", body: JSON.stringify(payload) });
        showToast(t("cardSaved"));
        onSaved(updated);
      } else {
        const created = await api("/cards/", { method: "POST", body: JSON.stringify(payload) });
        showToast(t("cardCreated"));
        onSaved(created);
      }
    } catch (err) {
      showToast(`${t("error")}: ${err.message}`);
    }
    setSaving(false);
  }

  const flashClass = (key) => (flashFields.has(key) ? "animate-fieldFlash" : "");
  const fieldBase =
    "w-full px-2.5 py-2.5 rounded-md border border-[#3a3227] bg-ink-3 text-cream text-sm resize-y";

  return (
    <div className="animate-fadeUp">
      <h1 className="font-mono text-[11px] tracking-[2px] uppercase text-brass font-semibold mb-3.5">
        {editingCard ? t("editCard") : t("newCard")}
      </h1>

      {!editingCard && (
        <div className={`bg-ink-3 border rounded-lg p-3 mb-4.5 ${aiGenerating ? "border-solid border-brass-dark ai-box-busy" : "border-dashed border-brass"}`}>
          <div className="font-mono text-[10px] tracking-wide uppercase text-brass mb-2">{t("aiCardLabel")}</div>
          <div className="flex gap-2">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={aiGenerating}
              placeholder={t("aiTopicPlaceholder")}
              className="flex-1 px-2.5 py-2 rounded-md border border-[#3a3227] bg-ink text-cream text-[13px]"
            />
            <button
              onClick={generate}
              disabled={aiGenerating}
              className="px-3 py-1.5 rounded-md bg-brass text-ink font-mono text-[10px] font-semibold uppercase
                         disabled:opacity-50 active:scale-[.97] transition-transform"
            >
              {aiGenerating ? <LoaderDots /> : t("generate")}
            </button>
          </div>
          {rejectReason && (
            <div className="flex items-start gap-2 font-mono text-[11px] mt-2.5 px-2.5 py-1.5 rounded border border-brass-dark bg-brass-dark/10 text-[#8a6d1f] leading-relaxed animate-fadeUp">
              ✋ {rejectReason}
            </div>
          )}
          {duplicateWarning && (
            <div className="flex items-start gap-2 font-mono text-[11px] mt-2.5 px-2.5 py-1.5 rounded border border-stamp bg-stamp/10 text-stamp leading-relaxed animate-fadeUp">
              ⚠ {t("duplicateWarning", duplicateWarning)}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3.5">
        <div>
          <label className="block font-mono text-[10px] tracking-wide uppercase text-brass mb-1.5">{t("front")}</label>
          <input
            value={form.front}
            onChange={(e) => setField("front", e.target.value)}
            placeholder={t("frontPlaceholder")}
            className={`${fieldBase} ${flashClass("front")}`}
          />
        </div>
        <div>
          <label className="block font-mono text-[10px] tracking-wide uppercase text-brass mb-1.5">{t("back")}</label>
          <input
            value={form.back}
            onChange={(e) => setField("back", e.target.value)}
            placeholder={t("backPlaceholder")}
            className={`${fieldBase} ${flashClass("back")}`}
          />
        </div>
        <div>
          <label className="block font-mono text-[10px] tracking-wide uppercase text-brass mb-1.5">{t("example")}</label>
          <textarea
            value={form.example}
            onChange={(e) => setField("example", e.target.value)}
            placeholder={t("examplePlaceholder")}
            className={`${fieldBase} min-h-[56px] ${flashClass("example")}`}
          />
        </div>
        <div>
          <label className="block font-mono text-[10px] tracking-wide uppercase text-brass mb-1.5">{t("note")}</label>
          <textarea
            value={form.note}
            onChange={(e) => setField("note", e.target.value)}
            placeholder={t("notePlaceholder")}
            className={`${fieldBase} min-h-[56px] ${flashClass("note")}`}
          />
        </div>
        <div className="flex gap-2.5">
          <div className="flex-1">
            <label className="block font-mono text-[10px] tracking-wide uppercase text-brass mb-1.5">{t("type")}</label>
            <select value={form.type} onChange={(e) => setField("type", e.target.value)} className={fieldBase}>
              {TYPES.map((ty) => (
                <option key={ty}>{ty}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block font-mono text-[10px] tracking-wide uppercase text-brass mb-1.5">{t("level")}</label>
            <select value={form.level} onChange={(e) => setField("level", e.target.value)} className={fieldBase}>
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block font-mono text-[10px] tracking-wide uppercase text-brass mb-1.5">{t("tags")}</label>
          <input
            value={form.tags}
            onChange={(e) => setField("tags", e.target.value)}
            placeholder={t("tagsPlaceholder")}
            className={fieldBase}
          />
        </div>
      </div>

      <div className="flex gap-2.5 mt-4">
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 py-3.5 rounded-md bg-brass text-ink font-mono text-xs font-semibold uppercase tracking-wide
                     disabled:opacity-50 active:scale-[.97] transition-transform"
        >
          {editingCard ? t("save") : t("createCard")}
        </button>
        {editingCard && (
          <button
            onClick={onCancel}
            className="py-3.5 px-5 rounded-md border border-[#3a3227] text-cream font-mono text-xs uppercase tracking-wide
                       active:scale-[.97] transition-transform"
          >
            {t("cancel")}
          </button>
        )}
      </div>
    </div>
  );
}
