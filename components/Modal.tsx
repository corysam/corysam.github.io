"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";

/**
 * Coque partagée par les fiches Projet et Expérience : fond, verrouillage du
 * défilement, fermeture à l'Échap et au clic extérieur, bouton de fermeture.
 * Les deux modales n'ont plus en propre que leur contenu.
 */
export function Modal({
  open,
  labelledBy,
  onClose,
  header,
  children,
}: {
  open: boolean;
  /** id du titre <h2> du contenu — porte le nom accessible du dialogue. */
  labelledBy: string;
  onClose: () => void;
  /** Bloc aligné à gauche du bouton de fermeture (pastille de statut). */
  header?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[rgba(5,8,22,0.7)] p-4 backdrop-blur-sm sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="my-auto w-full max-w-2xl rounded-3xl border border-line bg-canvas-alt p-7 shadow-[0_30px_80px_rgba(0,0,0,0.5)] sm:p-9"
          >
            <div className="flex items-start justify-between gap-4">
              {header}
              <motion.button
                onClick={onClose}
                whileHover={{ rotate: 90, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:text-white"
                aria-label="Fermer"
              >
                <X size={18} />
              </motion.button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Les rubriques d'une fiche. Celles dont le texte est vide sont écartées ici :
 * un intitulé seul donnerait l'impression d'une fiche cassée, et le séparateur
 * ne doit pas apparaître quand il ne reste rien à séparer.
 */
export function ModalRows({ rows }: { rows: { label: string; text: string }[] }) {
  const filled = rows.filter((row) => row.text);
  if (filled.length === 0) return null;

  return (
    <>
      <div className="my-5 h-px w-full bg-line-soft" />
      <div className="flex flex-col gap-6">
        {filled.map((r, i) => (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className="grid gap-2 sm:grid-cols-[120px_1fr]"
          >
            <p className="text-sm text-ink" style={{ fontFamily: "var(--font-display)" }}>
              {r.label}
            </p>
            <p className="text-sm text-muted" style={{ lineHeight: 1.6 }}>
              {r.text}
            </p>
          </motion.div>
        ))}
      </div>
    </>
  );
}

/** Galerie d'aperçus, identique sur les deux fiches. */
export function ModalImages({ images, alt }: { images: string[]; alt: string }) {
  if (images.length === 0) return null;

  return (
    <div className="mt-7 grid gap-4 sm:grid-cols-2">
      {images.map((src, i) => (
        <motion.div
          key={src}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + i * 0.1 }}
          className="overflow-hidden rounded-2xl border border-line-soft"
        >
          <ImageWithFallback
            src={src}
            alt={`${alt} aperçu ${i + 1}`}
            className="aspect-[4/3] h-full w-full object-cover"
          />
        </motion.div>
      ))}
    </div>
  );
}

/** Tous les liens de la fiche, pas seulement le premier (audit B3). */
export function ModalLinks({ links }: { links: { label: string; href: string }[] }) {
  const usable = links.filter((l) => l.label && l.href);
  if (usable.length === 0) return null;

  return (
    <div className="mt-7 flex flex-wrap justify-center gap-3">
      {usable.map((link) => (
        <motion.a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex rounded-full border border-line-soft px-5 py-2.5 text-sm text-muted transition-colors hover:border-white hover:text-white"
        >
          {link.label}
        </motion.a>
      ))}
    </div>
  );
}
