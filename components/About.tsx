"use client";

import { motion } from "motion/react";
import type { SectionId } from "@/lib/sections";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { useI18n } from "./I18nProvider";

// Ancré sur SECTIONS : renommer l'id côté nav casse la compilation ici (audit D4).
const SECTION_ID: SectionId = "about";

export function About({
  paragraphs,
  expertises,
  photo,
}: {
  paragraphs: string[];
  expertises: string[];
  /** Chemin public de la photo ; absent ou vide (champ vidé dans le CMS) = cadre vide. */
  photo?: string | null;
}) {
  const { t } = useI18n();
  return (
    <section id={SECTION_ID} className="mx-auto w-full max-w-5xl px-5 sm:px-6 py-20 sm:py-28 scroll-mt-24">
      <div className="grid gap-10 md:grid-cols-[380px_1fr] md:items-start">
        {/* Photo agrandie à gauche */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto aspect-[4/5] w-full max-w-[380px] overflow-hidden rounded-xl border border-line-soft bg-[rgba(200,205,220,0.6)] md:mx-0"
        >
          {photo && <ImageWithFallback src={photo} alt={t.about.photoAlt} className="h-full w-full object-cover" />}
        </motion.div>

        {/* Colonne droite : titre collé à droite, puis texte, puis tags */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto max-w-md text-center md:ml-auto md:mr-0 md:text-right"
        >
          <h2 className="text-2xl sm:text-3xl text-ink">{t.about.title}</h2>

          {paragraphs.map((text, i) => (
            <p
              key={i}
              className={`text-sm sm:text-base text-muted ${i === 0 ? "mt-6" : "mt-4"}`}
              style={{ lineHeight: 1.45 }}
            >
              {text}
            </p>
          ))}

          <div className="mt-7 flex flex-wrap justify-center gap-3 md:justify-end">
            {expertises.map((tag) => (
              <span
                key={tag}
                className="cursor-default rounded-full border border-line px-4 py-2 text-sm text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
