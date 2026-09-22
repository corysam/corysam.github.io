"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import type { Experiment } from "@/lib/types";
import { ACCENT_COLORS, mix } from "@/lib/types";

// Bulle du Laboratory, partagée entre les rendus desktop et mobile (audit M4).
export function LabBubble({
  experiment,
  onClick,
  ...motionProps
}: {
  experiment: Experiment;
  onClick: () => void;
} & HTMLMotionProps<"button">) {
  const color = ACCENT_COLORS[experiment.accent];
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="flex items-center gap-2.5 rounded-full border border-line bg-canvas py-1.5 pl-1.5 pr-4 transition-colors hover:border-white"
      {...motionProps}
    >
      <span
        className="h-7 w-7 shrink-0 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 16px ${mix(color, 53)}` }}
      />
      <span className="flex flex-col text-left leading-tight">
        <span className="whitespace-nowrap text-xs" style={{ color }}>
          {experiment.category}
        </span>
        <span className="-mt-0.5 text-sm text-ink">{experiment.label}</span>
      </span>
    </motion.button>
  );
}
