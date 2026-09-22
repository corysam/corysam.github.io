"use client";

import { useState } from "react";
import { Projects } from "./Projects";
import { Laboratory } from "./Laboratory";
import { ProjectModal } from "./ProjectModal";
import { ExperimentModal } from "./ExperimentModal";
import type { Experiment, Lab, Project } from "@/lib/types";

/**
 * La fiche ouverte : projet ou expérience, jamais les deux. Un seul état plutôt
 * que deux — deux `useState` indépendants finiraient par diverger et laisser
 * deux dialogues ouverts en même temps.
 */
type OpenSheet = { kind: "project"; project: Project } | { kind: "experiment"; experiment: Experiment };

// Seul état client de la page, partagé entre la grille de projets et les
// bulles du Laboratory.
export function Showcase({ projects, lab }: { projects: Project[]; lab: Lab }) {
  const [open, setOpen] = useState<OpenSheet | null>(null);
  const close = () => setOpen(null);

  return (
    <>
      <Projects projects={projects} onOpen={(project) => setOpen({ kind: "project", project })} />
      <Laboratory lab={lab} onOpen={(experiment) => setOpen({ kind: "experiment", experiment })} />
      <ProjectModal project={open?.kind === "project" ? open.project : null} onClose={close} />
      <ExperimentModal
        experiment={open?.kind === "experiment" ? open.experiment : null}
        onClose={close}
      />
    </>
  );
}
