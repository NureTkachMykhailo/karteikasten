import { useCallback, useEffect, useState } from "react";
import { api, getToken, clearToken } from "./api";
import { todayStr, addDays } from "./helpers";
import { Header, Tabs } from "./components/Header";
import { Toast } from "./components/UI";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { Catalog } from "./components/Catalog";
import { Review } from "./components/Review";
import { CardForm } from "./components/CardForm";

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  const [tab, setTab] = useState("dash");
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [aiGenerating, setAiGenerating] = useState(false);
  const [dialogueDe, setDialogueDe] = useState(null);
  const [dialogueEn, setDialogueEn] = useState(null);

  const [toast, setToast] = useState("");
  const [streak, setStreak] = useState(Number(localStorage.getItem("streak") || 0));
  const [lastReviewDate, setLastReviewDate] = useState(localStorage.getItem("lastReviewDate") || null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2400);
  }, []);

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/cards/");
      setCards(data);
    } catch (err) {
      showToast("Backend nicht erreichbar: " + err.message);
    }
    setLoading(false);
  }, [showToast]);

  const checkAuth = useCallback(async () => {
    if (!getToken()) {
      setAuthChecked(true);
      return;
    }
    try {
      const me = await api("/auth/me");
      setUser(me);
      await loadCards();
    } catch {
      clearToken();
      setUser(null);
    }
    setAuthChecked(true);
  }, [loadCards]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  function logout() {
    clearToken();
    setUser(null);
    setCards([]);
  }

  function dueToday() {
    const t = todayStr();
    return cards.filter((c) => c.due_date <= t);
  }

  function bumpStreak() {
    const t = todayStr();
    if (lastReviewDate === t) return;
    const yesterday = addDays(t, -1);
    const next = lastReviewDate === yesterday ? streak + 1 : 1;
    setStreak(next);
    setLastReviewDate(t);
    localStorage.setItem("streak", next);
    localStorage.setItem("lastReviewDate", t);
  }

  async function rateCard(cardId, rating) {
    try {
      const updated = await api(`/cards/${cardId}/review`, { method: "POST", body: JSON.stringify({ rating }) });
      setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
    } catch (err) {
      showToast("Fehler beim Speichern: " + err.message);
    }
    bumpStreak();
  }

  async function deleteCard(id) {
    if (!confirm("Diese Karte wirklich löschen?")) return;
    try {
      await api(`/cards/${id}`, { method: "DELETE" });
      setCards((prev) => prev.filter((c) => c.id !== id));
      showToast("Karte gelöscht");
    } catch (err) {
      showToast("Fehler: " + err.message);
    }
  }

  async function generateDialogue() {
    setAiGenerating(true);
    try {
      const res = await api("/ai/generate-dialogue", { method: "POST", body: JSON.stringify({ due_today: true, limit: 8 }) });
      setDialogueDe(res.dialogue_de);
      setDialogueEn(res.dialogue_en);
    } catch (err) {
      showToast("KI-Fehler: " + err.message);
    }
    setAiGenerating(false);
  }

  function changeTab(next) {
    if (next === "add") setEditingId(null);
    if (next === "review") {
      setDialogueDe(null);
      setDialogueEn(null);
    }
    setTab(next);
  }

  if (!authChecked) {
    return (
      <div className="max-w-[640px] mx-auto px-4 pt-24 text-center text-muted relative z-10">
        <span className="inline-block w-4 h-4 rounded-full border-2 border-cream/25 border-t-brass animate-spin mr-2 align-middle" />
        Lade Karteikasten…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-[640px] mx-auto px-4 relative z-10">
        <Login onLoggedIn={checkAuth} showToast={showToast} />
        <Toast message={toast} />
      </div>
    );
  }

  const editingCard = editingId ? cards.find((c) => c.id === editingId) : null;
  const boxCounts = {};
  cards.forEach((c) => (boxCounts[c.box] = (boxCounts[c.box] || 0) + 1));

  return (
    <div className="max-w-[640px] md:max-w-[780px] mx-auto px-4 pb-16 pt-1 md:pt-9 relative z-10">
      <Header userEmail={user.email} onLogout={logout} />
      <Tabs active={tab} onChange={changeTab} />

      <div className="mt-5">
        {loading ? (
          <div className="text-center py-10 px-5 text-muted">
            <span className="inline-block w-4 h-4 rounded-full border-2 border-cream/25 border-t-brass animate-spin mr-2 align-middle" />
            Lade Karteikasten…
          </div>
        ) : tab === "dash" ? (
          <Dashboard
            dueCount={dueToday().length}
            total={cards.length}
            streak={streak}
            boxCounts={boxCounts}
            onStartReview={() => changeTab("review")}
          />
        ) : tab === "catalog" ? (
          <Catalog
            cards={cards}
            search={search}
            onSearch={setSearch}
            filterType={filterType}
            onFilterType={setFilterType}
            onEdit={(id) => {
              setEditingId(id);
              setTab("add");
            }}
            onDelete={deleteCard}
          />
        ) : tab === "review" ? (
          <Review
            dueCards={dueToday()}
            allCards={cards}
            aiGenerating={aiGenerating}
            dialogueDe={dialogueDe}
            dialogueEn={dialogueEn}
            onGenerateDialogue={generateDialogue}
            onRate={rateCard}
          />
        ) : (
          <CardForm
            editingCard={editingCard}
            showToast={showToast}
            onCancel={() => {
              setEditingId(null);
              setTab("catalog");
            }}
            onSaved={(saved) => {
              setCards((prev) => {
                const exists = prev.some((c) => c.id === saved.id);
                return exists ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved];
              });
              setEditingId(null);
              setTab("catalog");
            }}
          />
        )}
      </div>

      <Toast message={toast} />
    </div>
  );
}
