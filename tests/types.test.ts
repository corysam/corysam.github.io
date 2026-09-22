import { describe, expect, it } from "vitest";
import {
  ACCENT_COLORS,
  EXPERIMENT_STATUS_ACCENT,
  NEUTRAL_COLOR,
  STATUS_ACCENT,
  experimentStatusColor,
  mix,
  statusColor,
} from "@/lib/types";
import type { AccentName, ExperimentStatus, ProjectStatus } from "@/lib/types";

const ACCENTS: AccentName[] = ["green", "cyan", "yellow", "red", "violet"];
const STATUSES: ProjectStatus[] = ["Delivered", "In development"];
const EXPERIMENT_STATUSES: ExperimentStatus[] = ["Prototype", "Ongoing", "Paused", "Abandoned"];

describe("couleurs (régression audit D2)", () => {
  it("chaque accent pointe vers une variable CSS du thème", () => {
    for (const a of ACCENTS) {
      expect(ACCENT_COLORS[a]).toBe(`var(--color-status-${a})`);
    }
  });

  // La couleur dérive du statut : elle n'est plus dupliquée dans le contenu.
  it("le statut détermine la couleur, sans la stocker dans les données", () => {
    expect(STATUS_ACCENT.Delivered).toBe("green");
    expect(STATUS_ACCENT["In development"]).toBe("cyan");
    expect(statusColor("Delivered")).toBe(ACCENT_COLORS.green);
    expect(statusColor("In development")).toBe(ACCENT_COLORS.cyan);
  });

  it("chaque statut connu possède une couleur résolue", () => {
    for (const s of STATUSES) expect(statusColor(s)).toMatch(/^var\(--color-status-/);
  });

  // Un status libre ou absent ne doit jamais produire "undefined" dans le CSS.
  it("retombe sur une couleur neutre pour un statut inconnu ou vide", () => {
    expect(statusColor("Work in Progress")).toBe(NEUTRAL_COLOR);
    expect(statusColor("")).toBe(NEUTRAL_COLOR);
    expect(mix(statusColor(""), 33)).not.toContain("undefined");
  });

  // Remplace la concaténation hex "55"/"14", qui cassait sur rgb() ou hex court.
  it("mix() produit un color-mix valide, y compris pour des couleurs non hex", () => {
    expect(mix("var(--color-status-green)", 33)).toBe(
      "color-mix(in srgb, var(--color-status-green) 33%, transparent)"
    );
    expect(mix("rgb(0 0 0)", 8)).toBe("color-mix(in srgb, rgb(0 0 0) 8%, transparent)");
  });
});

// Une expérience a ses propres statuts : « Prototype » n'a pas de sens pour un
// projet client, et « Delivered » n'en a pas pour un bac à sable.
describe("couleurs des statuts d'expérience", () => {
  it("chaque statut d'expérience connu a une couleur résolue", () => {
    for (const s of EXPERIMENT_STATUSES) {
      expect(experimentStatusColor(s)).toMatch(/^var\(--color-status-/);
    }
  });

  it("distingue les statuts entre eux", () => {
    expect(EXPERIMENT_STATUS_ACCENT.Prototype).toBe("violet");
    expect(EXPERIMENT_STATUS_ACCENT.Abandoned).toBe("red");
    expect(experimentStatusColor("Paused")).toBe(ACCENT_COLORS.yellow);
  });

  it("retombe sur une couleur neutre pour un statut libre ou vide", () => {
    expect(experimentStatusColor("Enterré")).toBe(NEUTRAL_COLOR);
    expect(experimentStatusColor("")).toBe(NEUTRAL_COLOR);
  });
});
