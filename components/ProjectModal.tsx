"use client";

import type { Project } from "@/lib/types";
import { StatusPill } from "./StatusPill";
import { Modal, ModalImages, ModalLinks, ModalRows } from "./Modal";

export function ProjectModal({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={project !== null}
      labelledBy="project-modal-title"
      onClose={onClose}
      header={project && <StatusPill status={project.status} />}
    >
      {project && (
        <>
          <h2 id="project-modal-title" className="mt-4 text-3xl text-ink">
            {project.name}
          </h2>
          {project.role && <p className="mt-1 text-sm text-muted">{project.role}</p>}

          <ModalRows
            rows={[
              { label: "Mission", text: project.mission },
              { label: "Problem", text: project.problem },
              { label: "Method", text: project.method },
              { label: "Result", text: project.result },
            ]}
          />
          <ModalImages images={project.images} alt={project.name} />
          <ModalLinks links={project.links} />
        </>
      )}
    </Modal>
  );
}
