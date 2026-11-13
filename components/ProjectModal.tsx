"use client";

import type { Project } from "@/lib/types";
import { StatusPill } from "./StatusPill";
import { Modal, ModalImages, ModalLinks, ModalRows } from "./Modal";
import { useI18n } from "./I18nProvider";

export function ProjectModal({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
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
              { label: t.project.mission, text: project.mission },
              { label: t.project.problem, text: project.problem },
              { label: t.project.method, text: project.method },
              { label: t.project.result, text: project.result },
            ]}
          />
          <ModalImages images={project.images} alt={project.name} />
          <ModalLinks links={project.links} />
        </>
      )}
    </Modal>
  );
}
