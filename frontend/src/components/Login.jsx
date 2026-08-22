import { useEffect, useRef, useState } from "react";
import { api, setToken } from "../api";
import { useLang } from "../LangContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function GoogleButton({ onLoggedIn, showToast }) {
  const btnRef = useRef(null);
  const { t } = useLang();

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    async function handleCredential(response) {
      try {
        const res = await api("/auth/google", {
          method: "POST",
          body: JSON.stringify({ id_token: response.credential }),
        });
        setToken(res.access_token);
        await onLoggedIn();
      } catch (err) {
        showToast(`${t("googleLoginFailed")}: ${err.message}`);
      }
    }

    function init() {
      if (!window.google || !btnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
      });
    }

    if (window.google) {
      init();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = init;
      document.body.appendChild(script);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <>
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[#3a3227]" />
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted">{t("or")}</span>
        <div className="flex-1 h-px bg-[#3a3227]" />
      </div>
      <div ref={btnRef} className="flex justify-center" />
    </>
  );
}

export function Login({ onLoggedIn, showToast }) {
  const { t, lang, setLang } = useLang();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToast(t("fillEmailPassword"));
      return;
    }
    setBusy(true);
    try {
      if (mode === "register") {
        await api("/auth/register", {
          method: "POST",
          body: JSON.stringify({ email: email.trim(), password }),
        });
        showToast(t("accountCreated"));
      }
      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      setToken(res.access_token);
      await onLoggedIn();
    } catch (err) {
      showToast(`${t("error")}: ${err.message}`);
    }
    setBusy(false);
  }

  return (
    <div className="max-w-sm mx-auto mt-16 animate-fadeUp relative">
      <div className="flex justify-center font-mono text-[10px] uppercase tracking-wide border border-[#3a3227] rounded-full overflow-hidden w-fit mx-auto mb-6">
        {["de", "en"].map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-2.5 py-1 transition-colors ${
              lang === l ? "bg-brass text-ink font-semibold" : "text-muted hover:text-cream"
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="text-center mb-8">
        <div className="font-display text-3xl tracking-wide text-brass">{t("appName")}</div>
        <div className="mt-1 font-mono text-[10px] tracking-[3px] text-muted uppercase">{t("tagline")}</div>
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
            {m === "login" ? t("login") : t("register")}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3.5">
        <div>
          <label className="block font-mono text-[10px] tracking-wide uppercase text-brass mb-1.5">{t("email")}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 rounded-md border border-[#3a3227] bg-ink-3 text-cream text-sm"
            placeholder="du@beispiel.de"
          />
        </div>
        <div>
          <label className="block font-mono text-[10px] tracking-wide uppercase text-brass mb-1.5">{t("password")}</label>
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
          {busy ? "…" : mode === "login" ? t("login") : t("createAccountAndLogin")}
        </button>
      </form>

      <GoogleButton onLoggedIn={onLoggedIn} showToast={showToast} />
    </div>
  );
}
