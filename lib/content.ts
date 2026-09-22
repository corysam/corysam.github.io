// Loaders de contenu — build-time uniquement (fs n'existe pas côté navigateur).
// À n'importer que depuis des composants serveur (app/page.tsx).

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { AccentName, Experiment, Lab, Profile, Project, ProjectLink, Recommendation, StackRow } from "./types";

/** Racine du contenu. Paramétrable pour permettre de tester sur des fixtures. */
const defaultContentDir = () => path.join(process.cwd(), "content");

function readJson<T>(contentDir: string, file: string): T {
  return JSON.parse(fs.readFileSync(path.join(contentDir, file), "utf8")) as T;
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

/** Seuls les liens ayant à la fois un libellé et une URL sont rendus. */
function toLinks(value: unknown): ProjectLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => ({
      label: text((entry as ProjectLink | null)?.label),
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

export function getProjects(contentDir: string = defaultContentDir()): Project[] {
  const dir = path.join(contentDir, "projects");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const id = file.replace(/\.md$/, "");
      const { data } = matter(fs.readFileSync(path.join(dir, file), "utf8"));

      return {
        id,
        name: text(data.name) || nameFromId(id),
        status: text(data.status),
        role: text(data.role),
        description: text(data.description),
        mission: text(data.mission),
        problem: text(data.problem),
        method: text(data.method),
        result: text(data.result),
        order: toOrder(data.order),
        links: toLinks(data.links),
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

function toPercent(value: unknown, fallback: number): number {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

/**
 * Position de repli d'une bulle sans x/y : sur un cercle plutôt qu'en (0,0),
 * pour qu'une expérience tout juste créée ne se superpose pas aux autres.
 */
function fallbackPosition(index: number, total: number) {
  const angle = (index / Math.max(total, 1)) * 2 * Math.PI - Math.PI / 2;
  return { x: 50 + Math.cos(angle) * 32, y: 50 + Math.sin(angle) * 30 };
}

function toTech(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(text).filter((item) => item !== "");
}

export function getExperiments(contentDir: string = defaultContentDir()): Experiment[] {
  const dir = path.join(contentDir, "experiments");
  // Le dossier peut ne pas exister tant qu'aucune expérience n'est écrite.
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

  return files
    .map((file, i) => {
      const id = file.replace(/\.md$/, "");
      const { data } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
      const name = text(data.name) || nameFromId(id);
      const spread = fallbackPosition(i, files.length);

      return {
        id,
        name,
        // La bulle est étroite : `label` est le texte court, `name` le titre de la fiche.
        label: text(data.label) || name,
        category: text(data.category),
        accent: toAccent(data.accent),
        x: toPercent(data.x, spread.x),
        y: toPercent(data.y, spread.y),
        order: toOrder(data.order),
        status: text(data.status),
        year: text(data.year),
        description: text(data.description),
        idea: text(data.idea),
        learnings: text(data.learnings),
        nextSteps: text(data.nextSteps),
        tech: toTech(data.tech),
        links: toLinks(data.links),
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

  return { experiments, edges };
}

export function getStack(contentDir: string = defaultContentDir()): StackRow[] {
  return readJson<{ rows: StackRow[] }>(contentDir, "stack.json").rows;
}

export function getRecommendations(contentDir: string = defaultContentDir()): Recommendation[] {
  return readJson<{ items: Recommendation[] }>(contentDir, "recommendations.json").items;
}

export function getProfile(contentDir: string = defaultContentDir()): Profile {
  return readJson<Profile>(contentDir, "profile.json");
}
