"use client";

import { motion } from "motion/react";
import { Briefcase, Linkedin, type LucideIcon } from "lucide-react";
import { Section } from "./Section";
import { useI18n } from "./I18nProvider";
import { mix, SOURCE_COLORS, type Recommendation, type RecommendationSource } from "@/lib/types";

/** Malt n'a pas d'icône dédiée dans lucide : la mallette évoque la mission freelance. */
const SOURCES: Record<RecommendationSource, { label: string; Icon: LucideIcon }> = {
  linkedin: { label: "LinkedIn", Icon: Linkedin },
  malt: { label: "Malt", Icon: Briefcase },
};

function SourceBadge({ source }: { source: RecommendationSource }) {
  const entry = SOURCES[source];
  // Source inconnue (contenu en cours de rédaction) : pas de badge vide.
  if (!entry) return null;

  const color = SOURCE_COLORS[source];
  const { label, Icon } = entry;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
      style={{
        color,
        border: `1px solid ${mix(color, 33)}`,
        backgroundColor: mix(color, 8),
      }}
    >
      <Icon size={13} aria-hidden />
      {label}
    </span>
  );
}

export function Recommendations({ items }: { items: Recommendation[] }) {
  const { t } = useI18n();
  return (
    <Section id="recommandation" title={t.titles.recommandation}>
      <div className="grid gap-5 sm:grid-cols-2">
        {items.map((r, i) => (
          <motion.article
            key={r.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="rounded-2xl border border-line bg-card p-6 text-center md:text-left"
          >
            <div className="mb-3 flex justify-center md:justify-end">
              <SourceBadge source={r.source} />
            </div>
            <p className="text-xl text-ink" style={{ fontFamily: "var(--font-display)" }}>
              {r.name}
            </p>
            <p className="mt-1 text-xs text-muted">{r.role}</p>
            <p className="mt-4 text-sm text-muted" style={{ lineHeight: 1.6 }}>
              {r.text}
            </p>
          </motion.article>
        ))}
      </div>
    </Section>
  );
}
