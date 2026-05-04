import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Lang, LANGUAGES, TRANSLATIONS } from "./translations";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string) => string;
  dir: "rtl" | "ltr";
};

const LangCtx = createContext<Ctx | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = (localStorage.getItem("app_lang") as Lang | null) ?? "ar";
    return LANGUAGES.some((l) => l.code === saved) ? saved : "ar";
  });

  const dir = LANGUAGES.find((l) => l.code === lang)?.dir ?? "rtl";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.documentElement.dataset.lang = lang;
  }, [lang, dir]);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("app_lang", l);
  };

  const t = (k: string) => TRANSLATIONS[lang][k] ?? TRANSLATIONS.ar[k] ?? k;

  return <LangCtx.Provider value={{ lang, setLang, t, dir }}>{children}</LangCtx.Provider>;
};

export const useT = () => {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error("useT must be inside LanguageProvider");
  return ctx;
};
