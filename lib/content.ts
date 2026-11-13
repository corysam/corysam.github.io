// Loaders de contenu — build-time uniquement (fs n'existe pas côté navigateur).
// À n'importer que depuis des composants serveur (app/page.tsx).

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { layoutLab } from "./layout";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "./i18n";
import type { AccentName, Experiment, Lab, Profile, Project, ProjectLink, Recommendation, StackRow } from "./types";

/** Racine du contenu. Paramétrable pour permettre de tester sur des fixtures. */
const defaultContentDir = () => path.join(process.cwd(), "content");

function readJson<T>(contentDir: string, file: string): T {
  return JSON.parse(fs.readFileSync(path.join(contentDir, file), "utf8")) as T;
}

// ---- Traductions -----------------------------------------------------------
// Disposition Sveltia `multiple_files` : le français est le fichier sans suffixe
// (`makidoo.md`, `profile.json`), l'anglais son jumeau suffixé (`makidoo.en.md`,
// `profile.en.json`). Le fichier français reste la seule source des champs
// structurels (ordre, couleurs, liens, images…) ; la traduction ne fournit que
// les textes, et chaque texte manquant retombe sur le français. Une traduction
// incomplète ne casse donc jamais la version anglaise.

type Data = Record<string, unknown>;

/** `makidoo.en.md` est la traduction de `makidoo.md`, pas un projet de plus. */
const isTranslationFile = (file: string) =>
  LOCALES.some((l) => l !== DEFAULT_LOCALE && file.endsWith(`.${l}.md`));

/** Frontmatter de la traduction d'une entrée — vide en français ou tant qu'elle n'existe pas. */
function readEntryTranslation(dir: string, id: string, locale: Locale): Data {
  if (locale === DEFAULT_LOCALE) return {};
  const file = path.join(dir, `${id}.${locale}.md`);
  return fs.existsSync(file) ? matter(fs.readFileSync(file, "utf8")).data : {};
}

/** Traduction d'un fichier JSON (`profile.en.json`) — vide en français ou si absente. */
function readJsonTranslation(contentDir: string, file: string, locale: Locale): Data {
  if (locale === DEFAULT_LOCALE) return {};
  const translated = path.join(contentDir, file.replace(/\.json$/, `.${locale}.json`));
  return fs.existsSync(translated) ? (JSON.parse(fs.readFileSync(translated, "utf8")) as Data) : {};
}

/** Liste de textes traduite si elle contient au moins une entrée, sinon celle du français. */
function translatedList(translated: unknown, base: string[]): string[] {
  const list = Array.isArray(translated) ? translated.map(text).filter((item) => item !== "") : [];
  return list.length > 0 ? list : base;
}

// ---- Normalisation du frontmatter ----------------------------------------
// Un projet s'écrit au fil de l'eau : les champs absents deviennent des chaînes
// vides, que les composants n'affichent pas. `npm run check:content` reste le
// garde-fou qui signale ce qu'il reste à remplir, sans bloquer le build.

/** Champ de texte : `null`, absent ou non textuel → "". */
function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

/** "movies-reco" → "Movies Reco" : un nom de repli plutôt qu'une carte anonyme. */
function nameFromId(id: string): string {
  return id
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Seuls les liens ayant à la fois un libellé et une URL sont rendus. L'URL vient
 * toujours du français ; le libellé de la traduction, au même rang, le remplace.
 */
function toLinks(value: unknown, translated?: unknown): ProjectLink[] {
  if (!Array.isArray(value)) return [];
  const labels = Array.isArray(translated) ? translated : [];
  return value
    .map((entry, i) => ({
      label: text((labels[i] as ProjectLink | null)?.label) || text((entry as ProjectLink | null)?.label),
      href: text((entry as ProjectLink | null)?.href),
    }))
    .filter((link) => link.label !== "" && link.href !== "");
}

function toImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(text).filter((src) => src !== "");
}

/** Un `order` absent ou illisible passe en fin de liste plutôt qu'en NaN. */
function toOrder(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : 999;
}

export function getProjects(contentDir: string = defaultContentDir(), locale: Locale = DEFAULT_LOCALE): Project[] {
  const dir = path.join(contentDir, "projects");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !isTranslationFile(f))
    .map((file) => {
      const id = file.replace(/\.md$/, "");
      const { data } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
      const tr = readEntryTranslation(dir, id, locale);
      const t = (key: string) => text(tr[key]) || text(data[key]);

      return {
        id,
        name: t("name") || nameFromId(id),
        status: text(data.status),
        role: t("role"),
        description: t("description"),
        mission: t("mission"),
        problem: t("problem"),
        method: t("method"),
        result: t("result"),
        order: toOrder(data.order),
        links: toLinks(data.links, tr.links),
        images: toImages(data.images),
      } satisfies Project;
    })
    .sort((a, b) => a.order - b.order);
}

// ---- Expériences -----------------------------------------------------------
// Petits projets personnels du Laboratory. Même tolérance que les projets : un
// fichier à peine commencé se charge, `npm run check:content` signale les trous.

const ACCENTS: AccentName[] = ["green", "cyan", "yellow", "red", "violet"];

/** `accent` pilote une variable CSS : hors liste, la bulle n'aurait pas de couleur. */
function toAccent(value: unknown): AccentName {
  const accent = text(value) as AccentName;
  return ACCENTS.includes(accent) ? accent : "violet";
}

/** Position manuelle en % — absente ou invalide, la bulle est placée automatiquement. */
function toPercent(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
}

function toTech(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(text).filter((item) => item !== "");
}

export function getExperiments(contentDir: string = defaultContentDir(), locale: Locale = DEFAULT_LOCALE): Experiment[] {
  const dir = path.join(contentDir, "experiments");
  // Le dossier peut ne pas exister tant qu'aucune expérience n'est écrite.
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md") && !isTranslationFile(f));

  return files
    .map((file) => {
      const id = file.replace(/\.md$/, "");
      const { data } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
      const tr = readEntryTranslation(dir, id, locale);
      const t = (key: string) => text(tr[key]) || text(data[key]);
      const name = t("name") || nameFromId(id);

      return {
        id,
        name,
        // La bulle est étroite : `label` est le texte court, `name` le titre de la fiche.
        label: t("label") || name,
        category: t("category"),
        accent: toAccent(data.accent),
        x: toPercent(data.x),
        y: toPercent(data.y),
        order: toOrder(data.order),
        status: text(data.status),
        year: text(data.year),
        description: t("description"),
        idea: t("idea"),
        learnings: t("learnings"),
        nextSteps: t("nextSteps"),
        tech: toTech(data.tech),
        links: toLinks(data.links, tr.links),
        images: toImages(data.images),
      } satisfies Experiment;
    })
    .sort((a, b) => a.order - b.order);
}

// ---- Formes sur disque ----------------------------------------------------
// Le CMS ne sait pas éditer un tuple : les arêtes sont stockées en objets
// { from, to }. L'enveloppe s'arrête ici — le loader renvoie le type du domaine.

type LabFile = { edges?: { from: string; to: string }[] };

export function getLab(experiments: Experiment[], contentDir: string = defaultContentDir()): Lab {
  const file = path.join(contentDir, "lab.json");
  // Les bulles vivent dans content/experiments/ : le graphe s'affiche même
  // sans fichier d'arêtes.
  const lab: LabFile = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  const ids = new Set(experiments.map((e) => e.id));

  // Une arête vers un id inconnu est ignorée (avec avertissement) au lieu de faire planter le rendu.
  const edges = (lab.edges ?? [])
    .map(({ from, to }) => [from, to] as [string, string])
    .filter(([a, b]) => {
      const valid = ids.has(a) && ids.has(b);
      if (!valid) console.warn(`content/lab.json : arête ignorée [${a}, ${b}] — expérience inconnue`);
      return valid;
    });

  return { experiments: layoutLab(experiments, edges), edges };
}

/** Catégories rapprochées par rang : la traduction suit l'ordre du français. */
export function getStack(contentDir: string = defaultContentDir(), locale: Locale = DEFAULT_LOCALE): StackRow[] {
  const rows = readJson<{ rows: StackRow[] }>(contentDir, "stack.json").rows;
  const tr = readJsonTranslation(contentDir, "stack.json", locale).rows;
  const trRows = (Array.isArray(tr) ? tr : []) as Data[];
  return rows.map((row, i) => ({
    ...row,
    label: text(trRows[i]?.label) || row.label,
    items: translatedList(trRows[i]?.items, row.items),
  }));
}

/** Témoignages rapprochés par `id` : nom et plateforme restent ceux du français. */
export function getRecommendations(
  contentDir: string = defaultContentDir(),
  locale: Locale = DEFAULT_LOCALE
): Recommendation[] {
  const items = readJson<{ items: Recommendation[] }>(contentDir, "recommendations.json").items;
  const tr = readJsonTranslation(contentDir, "recommendations.json", locale).items;
  const byId = new Map(((Array.isArray(tr) ? tr : []) as Data[]).map((item) => [text(item?.id), item]));
  return items.map((item) => {
    const translated = byId.get(item.id) ?? {};
    return {
      ...item,
      role: text(translated.role) || item.role,
      text: text(translated.text) || item.text,
    };
  });
}

/** Coordonnées, CV et photo viennent du français ; accroche, paragraphes et expertises se traduisent. */
export function getProfile(contentDir: string = defaultContentDir(), locale: Locale = DEFAULT_LOCALE): Profile {
  const profile = readJson<Profile>(contentDir, "profile.json");
  const tr = readJsonTranslation(contentDir, "profile.json", locale);
  return {
    ...profile,
    tagline: text(tr.tagline) || profile.tagline,
    about: translatedList(tr.about, profile.about ?? []),
    expertises: translatedList(tr.expertises, profile.expertises ?? []),
  };
}
