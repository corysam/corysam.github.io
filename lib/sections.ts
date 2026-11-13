// Source unique de vérité pour les sections ET la navigation (audit D4) :
// un id de nav ne peut plus diverger d'un id de section.
// Les libellés sont traduits : ils vivent dans lib/i18n.ts (`t.nav`).

export const SECTIONS = [
  { id: "home" },
  { id: "about" },
  { id: "project" },
  { id: "laboratory" },
  { id: "stack" },
  { id: "recommandation" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];
