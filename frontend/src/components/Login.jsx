import { useState } from "react";
import { api, setToken } from "../api";

export function Login({ onLoggedIn, showToast }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToast("Bitte E-Mail und Passwort eingeben");
      return;
    }
    setBusy(true);
    try {
      if (mode === "register") {
        await api("/auth/register", {
          method: "POST",
          body: JSON.stringify({ email: email.trim(), password }),
        });
        showToast("Konto erstellt — du wirst angemeldet");
      }
      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      setToken(res.access_token);
      await onLoggedIn();
    } catch (err) {
      showToast("Fehler: " + err.message);
    }
    setBusy(false);
  }

  return (
    <div className="max-w-sm mx-auto mt-16 animate-fadeUp">
      <div className="text-center mb-8">
        <div className="font-display text-3xl tracking-wide text-brass">KARTEIKASTEN</div>
        <div className="mt-1 font-mono text-[10px] tracking-[3px] text-muted uppercase">
          Katalog &amp; Wiederholung · Deutsch
        </div>
      </div>

      <div className="flex gap-1.5 mb-5">
        {["login", "register"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-md font-mono text-[11px] uppercase tracking-wide transition-colors
                        ${
                          mode === m
                            ? "bg-paper text-ink-text font-semibold"
                            : "bg-ink-3 text-muted border border-[#3a3227]"
                        }`}
          >
            {m === "login" ? "Anmelden" : "Registrieren"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3.5">
        <div>
          <label className="block font-mono text-[10px] tracking-wide uppercase text-brass mb-1.5">
            E-Mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 rounded-md border border-[#3a3227] bg-ink-3 text-cream text-sm"
            placeholder="du@beispiel.de"
          />
        </div>
        <div>
          <label className="block font-mono text-[10px] tracking-wide uppercase text-brass mb-1.5">
            Passwort
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 rounded-md border border-[#3a3227] bg-ink-3 text-cream text-sm"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 rounded-md bg-brass text-ink font-mono text-xs font-semibold uppercase tracking-wide
                     disabled:opacity-50 active:scale-[.97] transition-transform"
        >
          {busy ? "…" : mode === "login" ? "Anmelden" : "Konto erstellen & anmelden"}
        </button>
      </form>
    </div>
  );
}
