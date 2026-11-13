"use client";

import { motion } from "motion/react";
import { Section } from "./Section";
import type { StackRow } from "@/lib/types";
import { ACCENT_COLORS } from "@/lib/types";
import { useI18n } from "./I18nProvider";

// Affiche les vraies technologies du contenu (audit M3 : plus de ronds vides).
export function Stack({ rows }: { rows: StackRow[] }) {
  const { t } = useI18n();
  return (
    <Section id="stack" title={t.titles.stack}>
      <div className="flex flex-col">
        {rows.map((row, r) => (
          <div key={row.label}>
            <div className="flex flex-col items-center gap-5 py-7 md:flex-row md:justify-between md:gap-4">
              <p
                className="text-base"
                style={{ color: ACCENT_COLORS[row.accent], fontFamily: "var(--font-display)" }}
              >
                {row.label}
              </p>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:justify-end">
                {row.items.map((item, i) => (
                  <motion.span
                    key={item}
                    initial={{ opacity: 0, scale: 0.6 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: r * 0.06 + i * 0.04, type: "spring", stiffness: 260, damping: 18 }}
                    whileHover={{ y: -6, scale: 1.08 }}
                    className="cursor-default rounded-full border border-line bg-card px-4 py-2 text-sm text-ink"
                  >
                    {item}
                  </motion.span>
                ))}
              </div>
            </div>
            {/* ligne de séparation entre catégories */}
            {r < rows.length - 1 && <div className="h-px w-full bg-line-soft" />}
          </div>
        ))}
      </div>
    </Section>
  );
}
