// Langues du site et textes de l'interface — importable côté client comme côté serveur.
// Le contenu éditorial (projets, profil…) ne vit pas ici : il est traduit dans
// content/ (fichiers `*.en.md` / `*.en.json`, voir lib/content.ts).

import type { KnownExperimentStatus, KnownProjectStatus } from "./types";
import type { SectionId } from "./sections";

export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** Langue des fichiers de contenu sans suffixe, et seule source des champs structurels. */
export const DEFAULT_LOCALE: Locale = "fr";

export const hasLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

/** Nom de chaque langue dans sa propre langue : c'est ainsi qu'un visiteur la reconnaît. */
export const LANGUAGE_NAMES: Record<Locale, string> = { fr: "Français", en: "English" };

/** Clé de localStorage partagée par le bouton de langue et la redirection de `/`. */
export const LOCALE_STORAGE_KEY = "lang";

type StatusLabels = Record<KnownProjectStatus | KnownExperimentStatus, string>;

const fr = {
  meta: {
    role: "Développeur Full Stack",
    description: (name: string) =>
      `Portfolio de ${name}, développeur expert en JavaScript : projets, expérimentations et stack technique.`,
  },
  /** Onglets de la navbar. */
  nav: {
    home: "Accueil",
    about: "À propos",
    project: "Projets",
    laboratory: "Labo",
    stack: "Stack",
    recommandation: "Recommandations",
  } satisfies Record<SectionId, string>,
  /** Titres affichés en tête de section. */
  titles: {
    project: "Projets",
    laboratory: "Laboratoire",
    stack: "Stack",
    recommandation: "Recommandations",
  },
  navbar: { menu: "Menu", language: "Langue" },
  hero: {
    greeting: "Bonjour, je suis",
    email: "E-mail",
    phone: "Téléphone",
    linkedin: "LinkedIn",
    copied: "Copié dans le presse-papier",
    resume: "Télécharger le CV",
    scrollDown: "Voir la suite",
  },
  about: { title: "À propos de moi", photoAlt: "Photo de profil" },
  project: { mission: "Mission", problem: "Problème", method: "Méthode", result: "Résultat" },
  experiment: {
    description: "Description",
    idea: "L'idée",
    learnings: "Ce que j'ai appris",
    nextSteps: "La suite",
    tech: "Technologies",
  },
  /** Libellés affichés des statuts — les clés restent celles du contenu, qui pilotent les couleurs. */
  status: {
    Delivered: "Livré",
    "In development": "En développement",
    Prototype: "Prototype",
    Ongoing: "En cours",
    Paused: "En pause",
    Abandoned: "Abandonné",
  } satisfies StatusLabels,
  modal: {
    close: "Fermer",
    preview: (name: string, n: number) => `${name} aperçu ${n}`,
    imageUnavailable: (alt: string) => `Image indisponible : ${alt}`,
  },
  footer: { developedWith: "Développé avec", by: "par" },
};

export type Dictionary = typeof fr;

const en: Dictionary = {
  meta: {
    role: "Full Stack Developer",
    description: (name: string) =>
      `Portfolio of ${name}, JavaScript expert developer: projects, experiments and tech stack.`,
  },
  nav: {
    home: "Home",
    about: "About",
    project: "Projects",
    laboratory: "Lab",
    stack: "Stack",
    recommandation: "Recommendations",
  },
  titles: {
    project: "Projects",
    laboratory: "Laboratory",
    stack: "Stack",
    recommandation: "Recommendations",
  },
  navbar: { menu: "Menu", language: "Language" },
  hero: {
    greeting: "Hello, I'm",
    email: "Email",
    phone: "Phone",
    linkedin: "LinkedIn",
    copied: "Copied to clipboard",
    resume: "Download Resume",
    scrollDown: "Scroll down",
  },
  about: { title: "About me", photoAlt: "Profile photo" },
  project: { mission: "Mission", problem: "Problem", method: "Method", result: "Result" },
  experiment: {
    description: "Description",
    idea: "Idea",
    learnings: "Learnings",
    nextSteps: "Next steps",
    tech: "Technologies",
  },
  status: {
    Delivered: "Delivered",
    "In development": "In development",
    Prototype: "Prototype",
    Ongoing: "Ongoing",
    Paused: "Paused",
    Abandoned: "Abandoned",
  },
  modal: {
    close: "Close",
    preview: (name: string, n: number) => `${name} preview ${n}`,
    imageUnavailable: (alt: string) => `Image unavailable: ${alt}`,
  },
  footer: { developedWith: "Developed with", by: "by" },
};

export const dictionaries: Record<Locale, Dictionary> = { fr, en };

/** Statut traduit ; un statut libre (« Work in Progress ») reste affiché tel quel. */
export const statusLabel = (t: Dictionary, status: string): string =>
  t.status[status as keyof StatusLabels] ?? status;

/** Chemin de la page d'une langue, ancré sur une section (hors accueil). */
export const localePath = (locale: Locale, section?: SectionId): string =>
  `/${locale}/${section && section !== "home" ? `#${section}` : ""}`;
