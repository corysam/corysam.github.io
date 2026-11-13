"use client";

import type { Experiment } from "@/lib/types";
import { experimentStatusColor, mix } from "@/lib/types";
import { statusLabel } from "@/lib/i18n";
import { Modal, ModalImages, ModalLinks, ModalRows } from "./Modal";
import { useI18n } from "./I18nProvider";

/** Pastille de statut d'une expérience — couleurs propres aux side projects. */
function ExperimentStatusPill({ status }: { status: string }) {
  const { t } = useI18n();
  if (!status) return null;

  const color = experimentStatusColor(status);
  return (
    <span
      className="rounded-full px-3 py-1 text-xs"
      style={{
        color,
        border: `1px solid ${mix(color, 33)}`,
        backgroundColor: mix(color, 8),
      }}
    >
      {statusLabel(t, status)}
    </span>
  );
}

export function ExperimentModal({
  experiment,
  onClose,
}: {
  experiment: Experiment | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  // Catégorie et année se lisent comme une seule ligne : « Simulation · 2025 ».
  const context = experiment ? [experiment.category, experiment.year].filter(Boolean) : [];

  return (
    <Modal
      open={experiment !== null}
      labelledBy="experiment-modal-title"
      onClose={onClose}
      header={experiment && <ExperimentStatusPill status={experiment.status} />}
    >
      {experiment && (
        <>
          <h2 id="experiment-modal-title" className="mt-4 text-3xl text-ink">
            {experiment.name}
          </h2>
          {context.length > 0 && <p className="mt-1 text-sm text-muted">{context.join(" · ")}</p>}

          {/* Rubriques d'un side project : l'envie de départ plutôt que la
              mission, ce que ça a appris plutôt que le livrable. */}
          <ModalRows
            rows={[
              { label: t.experiment.description, text: experiment.description },
              { label: t.experiment.idea, text: experiment.idea },
              { label: t.experiment.learnings, text: experiment.learnings },
              { label: t.experiment.nextSteps, text: experiment.nextSteps },
            ]}
          />

          {experiment.tech.length > 0 && (
            <ul aria-label={t.experiment.tech} className="mt-6 flex flex-wrap gap-2">
              {experiment.tech.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-line-soft px-3 py-1 text-xs text-muted"
                >
                  {item}
                </li>
              ))}
            </ul>
          )}

          <ModalImages images={experiment.images} alt={experiment.name} />
          <ModalLinks links={experiment.links} />
        </>
      )}
    </Modal>
  );
}
