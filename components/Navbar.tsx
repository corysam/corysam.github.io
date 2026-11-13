"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { SECTIONS, type SectionId } from "@/lib/sections";
import { useI18n } from "./I18nProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Navbar() {
  const { t } = useI18n();
  const [active, setActive] = useState<SectionId>(SECTIONS[0].id);
  const [open, setOpen] = useState(false);

  // Met à jour l'onglet actif : on choisit la dernière section dont le haut
  // est passé sous le header. Fiable quelle que soit la hauteur des sections.
  useEffect(() => {
    const update = () => {
      const line = 120; // hauteur sous le header servant de repère
      let current: SectionId = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= line) current = s.id;
      }
      // proche du bas de page : on force le dernier onglet
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = SECTIONS[SECTIONS.length - 1].id;
      }
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const go = (id: SectionId) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-line-soft bg-[rgba(11,18,38,0.85)] backdrop-blur-md">
      <nav className="relative mx-auto flex max-w-6xl items-center justify-center px-5 sm:px-8">
        {/* Tabs desktop centrés ; l'écart se resserre entre md et lg pour laisser la place au globe */}
        <ul className="hidden md:flex items-stretch justify-center gap-6 lg:gap-[70px]">
          {SECTIONS.map((item) => {
            const isActive = active === item.id;
            return (
              <li key={item.id} className="relative">
                <button
                  onClick={() => go(item.id)}
                  className={`relative px-2 py-4 text-sm transition-colors duration-200 ${
                    isActive ? "text-white" : "text-muted hover:text-ink"
                  }`}
                >
                  {t.nav[item.id]}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-2 right-2 h-px bg-white"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Bouton de langue, à droite : à côté du menu sur mobile, seul sur desktop */}
        <div className="absolute right-14 top-1/2 -translate-y-1/2 md:right-5">
          <LanguageSwitcher section={active} />
        </div>

        {/* Mobile : bouton menu, aligné à droite */}
        <button
          className="md:hidden absolute right-5 top-1/2 -translate-y-1/2 rounded-md p-2 text-ink"
          onClick={() => setOpen((o) => !o)}
          aria-label={t.navbar.menu}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="md:hidden h-14" />
      </nav>

      {/* Menu mobile */}
      {open && (
        <motion.ul
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden overflow-hidden px-3 pb-3"
        >
          {SECTIONS.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => go(item.id)}
                className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                  active === item.id ? "text-white" : "text-muted"
                }`}
              >
                {t.nav[item.id]}
              </button>
            </li>
          ))}
        </motion.ul>
      )}
    </header>
  );
}
