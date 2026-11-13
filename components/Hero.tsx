"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mail, Phone, Linkedin, Download, ChevronDown, Check } from "lucide-react";
import type { Profile } from "@/lib/types";
import type { SectionId } from "@/lib/sections";
import { useI18n } from "./I18nProvider";

type Social =
  | { Icon: typeof Mail; label: string; type: "copy"; value: string }
  | { Icon: typeof Mail; label: string; type: "link"; href: string };

/** Copie `value` dans le presse-papier et retourne si la copie a réellement réussi (audit B1). */
async function copyToClipboard(value: string): Promise<boolean> {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Clipboard API bloquée (permissions, iframe…) : on tente le fallback.
    }
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// Ancré sur SECTIONS : renommer l'id côté nav casse la compilation ici (audit D4).
const SECTION_ID: SectionId = "home";

export function Hero({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const socials: Social[] = [
    { Icon: Mail, label: t.hero.email, type: "copy", value: profile.email },
    { Icon: Phone, label: t.hero.phone, type: "copy", value: profile.phone },
    { Icon: Linkedin, label: t.hero.linkedin, type: "link", href: profile.linkedin },
  ];

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const scrollDown = () =>
    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });

  const copyValue = async (label: string, value: string) => {
    const ok = await copyToClipboard(value);
    // On ne confirme "copié" que si la copie a réellement eu lieu.
    setCopied(ok ? label : null);
    clearTimeout(copiedTimer.current);
    if (ok) {
      copiedTimer.current = setTimeout(() => setCopied((c) => (c === label ? null : c)), 2000);
    }
  };

  const iconButtonClass =
    "grid h-10 w-10 place-items-center rounded-full border border-line-soft text-muted transition-colors hover:border-white hover:text-white";

  return (
    <section
      id={SECTION_ID}
      className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-5 text-center sm:px-6 md:items-start md:text-left"
    >
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-sm text-muted"
      >
        {t.hero.greeting}
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="mt-2 text-5xl sm:text-7xl text-ink"
        style={{ lineHeight: 1.05 }}
      >
        {profile.name}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.12 }}
        className="mt-5 max-w-xl text-base sm:text-lg mx-auto md:mx-0 text-muted"
      >
        {profile.tagline}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-7 flex flex-col items-center gap-3 md:flex-row md:flex-wrap md:justify-start"
      >
        <div className="flex items-center gap-3">
          {socials.map((s) => {
            const { Icon, label } = s;

            if (s.type === "link") {
              return (
                <motion.a
                  key={label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  whileHover={{ y: -4, scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  className={iconButtonClass}
                >
                  <Icon size={18} />
                </motion.a>
              );
            }

            const isCopied = copied === label;
            return (
              <div key={label} className="group relative">
                <motion.button
                  type="button"
                  aria-label={label}
                  onClick={() => copyValue(label, s.value)}
                  whileHover={{ y: -4, scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  className={iconButtonClass}
                >
                  <Icon size={18} />
                </motion.button>

                <AnimatePresence>
                  {isCopied && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.18 }}
                      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-canvas-alt px-3 py-2 text-xs"
                    >
                      <span className="block text-ink">{s.value}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-status-green">
                        <Check size={12} /> {t.hero.copied}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {profile.resume && (
          <motion.a
            href={profile.resume}
            download
            whileHover={{ y: -4, scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 rounded-full border border-line-soft px-5 py-2.5 text-sm text-muted transition-colors hover:border-white hover:text-white md:ml-1"
          >
            <Download size={16} />
            {t.hero.resume}
          </motion.a>
        )}
      </motion.div>

      {/* Flèche de scroll vers la section suivante */}
      <motion.button
        onClick={scrollDown}
        aria-label={t.hero.scrollDown}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted transition-colors hover:text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 0.6 }, y: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } }}
        whileHover={{ scale: 1.2 }}
      >
        <ChevronDown size={28} />
      </motion.button>
    </section>
  );
}
