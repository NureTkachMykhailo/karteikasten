import { createContext, useContext, useState } from "react";
import { translations } from "./i18n";

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(localStorage.getItem("lang") || "de");

  function setLang(next) {
    setLangState(next);
    localStorage.setItem("lang", next);
  }

  function t(key, ...args) {
    const dict = translations[lang] || translations.de;
    const value = dict[key] ?? translations.de[key] ?? key;
    return typeof value === "function" ? value(...args) : value;
  }

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within a LangProvider");
  return ctx;
}
