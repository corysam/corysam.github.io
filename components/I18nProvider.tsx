"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_LOCALE, dictionaries, type Dictionary, type Locale } from "@/lib/i18n";

type I18n = { locale: Locale; t: Dictionary };

// Valeur par défaut : le français. Un composant rendu hors provider (tests)
// affiche donc la version française au lieu de planter.
const I18nContext = createContext<I18n>({ locale: DEFAULT_LOCALE, t: dictionaries[DEFAULT_LOCALE] });

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, t: dictionaries[locale] }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
