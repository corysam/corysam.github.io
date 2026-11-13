"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Globe } from "lucide-react";
import { LANGUAGE_NAMES, LOCALES, LOCALE_STORAGE_KEY, localePath, type Locale } from "@/lib/i18n";
import type { SectionId } from "@/lib/sections";
import { useI18n } from "./I18nProvider";

/** Mémorise le choix pour la redirection de `/` ; stockage bloqué = choix simplement non retenu. */
function rememberLocale(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // navigation privée, stockage désactivé…
  }
}

/**
 * Bouton « language » de la navbar : un globe qui déplie la liste des langues.
 * Chaque langue est un vrai lien vers sa page statique (/fr/, /en/), ancré sur
 * la section en cours de lecture pour ne pas renvoyer le visiteur en haut.
 */
// Le placement dans la page revient au parent : la racine reste `relative` pour
// ancrer la liste, et lui passer `absolute` en plus ferait entrer les deux
// classes en conflit (c'est l'ordre du CSS généré qui trancherait).
export function LanguageSwitcher({ section }: { section?: SectionId }) {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  // Fermeture au clic extérieur et à l'Échap, uniquement quand la liste est ouverte.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t.navbar.language}
        aria-expanded={open}
        aria-controls={listId}
        className={`grid h-9 w-9 place-items-center rounded-md transition-colors ${
          open ? "text-white" : "text-muted hover:text-white"
        }`}
      >
        <Globe size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 min-w-36 overflow-hidden rounded-lg border border-line-soft bg-[rgba(11,18,38,0.95)] py-1 shadow-[0_12px_32px_rgba(0,0,0,0.4)] backdrop-blur-md"
          >
            {LOCALES.map((l) => {
              const current = l === locale;
              return (
                <li key={l}>
                  <a
                    href={localePath(l, section)}
                    hrefLang={l}
                    lang={l}
                    aria-current={current ? "true" : undefined}
                    onClick={(e) => {
                      if (current) {
                        e.preventDefault();
                        setOpen(false);
                        return;
                      }
                      rememberLocale(l);
                    }}
                    className={`flex items-center justify-between gap-4 px-4 py-2 text-sm transition-colors ${
                      current ? "text-white" : "text-muted hover:text-ink"
                    }`}
                  >
                    {LANGUAGE_NAMES[l]}
                    {current && <Check size={14} aria-hidden />}
                  </a>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
