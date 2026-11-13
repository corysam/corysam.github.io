"use client";

import { Section } from "./Section";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/lib/types";
import { useI18n } from "./I18nProvider";

export function Projects({ projects, onOpen }: { projects: Project[]; onOpen: (p: Project) => void }) {
  const { t } = useI18n();
  return (
    <Section id="project" title={t.titles.project}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => (
          <ProjectCard key={p.id} project={p} onOpen={onOpen} index={i} />
        ))}
      </div>
    </Section>
  );
}
