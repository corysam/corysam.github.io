#!/usr/bin/env node
// Garde-fou pré-lancement (audit M5 / D3) : détecte le contenu encore
// "placeholder" ou incomplet dans content/. Volontairement séparé de
// `npm run build` — le site doit rester constructible pendant la rédaction du
// contenu : les loaders tolèrent les champs vides, c'est ici qu'on les signale.
//
//   npm run check:content   → code de sortie 1 s'il reste des placeholders.

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDir = path.join(process.cwd(), "content");
const findings = [];
const report = (file, message) => findings.push({ file, message });

const LOREM =
  /lorem ipsum|dolor sit amet|consectetur adipiscing|maecenas|suspendisse|nullam quis|sed ut perspiciatis|vestibulum/i;

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });

if (!fs.existsSync(contentDir)) {
  console.error("content/ introuvable");
  process.exit(1);
}

// 1. Texte lorem ipsum, quel que soit le fichier.
for (const file of walk(contentDir)) {
  const rel = path.relative(process.cwd(), file);
  const raw = fs.readFileSync(file, "utf8");
  raw.split("\n").forEach((line, i) => {
    if (LOREM.test(line)) report(rel, `ligne ${i + 1} : texte lorem ipsum`);
  });
  if (/href:\s*["']#["']|"href"\s*:\s*"#"/.test(raw)) {
    report(rel, 'lien placeholder href: "#"');
  }
  if (/\bTitre\b/.test(raw)) report(rel, 'libellé placeholder "Titre"');
  if (/placeholder-\d/.test(raw)) report(rel, "image placeholder");
}

// 2. Profil : CV et coordonnées.
const profilePath = path.join(contentDir, "profile.json");
if (fs.existsSync(profilePath)) {
  const profile = JSON.parse(fs.readFileSync(profilePath, "utf8"));
  if (!profile.resume) {
    report("content/profile.json", "resume: null — le bouton CV reste masqué");
  } else if (!fs.existsSync(path.join(process.cwd(), "public", profile.resume.replace(/^\//, "")))) {
    report("content/profile.json", `resume "${profile.resume}" introuvable dans public/`);
  }
  if (/^\+?[\d\s]*0{6,}/.test(String(profile.phone ?? "").replace(/\s/g, ""))) {
    report("content/profile.json", "numéro de téléphone factice");
  }
}

// 3. Laboratory : une liaison vers une expérience inexistante est ignorée
// silencieusement au build — le trait attendu n'apparaît jamais.
const experimentsDir = path.join(contentDir, "experiments");
const experimentIds = fs.existsSync(experimentsDir)
  ? fs
      .readdirSync(experimentsDir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""))
  : [];

const labPath = path.join(contentDir, "lab.json");
if (fs.existsSync(labPath)) {
  const lab = JSON.parse(fs.readFileSync(labPath, "utf8"));
  for (const [i, edge] of (lab.edges ?? []).entries()) {
    for (const end of ["from", "to"]) {
      const id = String(edge?.[end] ?? "").trim();
      if (!experimentIds.includes(id)) {
        report("content/lab.json", `edges[${i}].${end} : expérience "${id}" introuvable — liaison ignorée`);
      }
    }
  }
}

// 4. Recommandations : source manquante ou inconnue → badge masqué sur la carte.
const KNOWN_SOURCES = ["linkedin", "malt"];
const recoPath = path.join(contentDir, "recommendations.json");
if (fs.existsSync(recoPath)) {
  const reco = JSON.parse(fs.readFileSync(recoPath, "utf8"));
  for (const item of reco.items ?? []) {
    const source = String(item?.source ?? "").trim();
    if (!KNOWN_SOURCES.includes(source)) {
      report(
        "content/recommendations.json",
        `"${item?.id}" : source ${source ? `"${source}" inconnue` : "absente"} — badge masqué (connues : ${KNOWN_SOURCES.join(" | ")})`
      );
    }
  }
}

// 5. Projets : champs de frontmatter encore vides. Le build les tolère
// (la carte n'affiche simplement rien) — c'est ce rapport qui les rappelle.
const PROJECT_FIELDS = [
  "name",
  "status",
  "role",
  "description",
  "mission",
  "problem",
  "method",
  "result",
];
const KNOWN_STATUSES = ["Delivered", "In development"];

const projectsDir = path.join(contentDir, "projects");
if (fs.existsSync(projectsDir)) {
  for (const file of fs.readdirSync(projectsDir).filter((f) => f.endsWith(".md"))) {
    const rel = path.join("content", "projects", file);
    const { data } = matter(fs.readFileSync(path.join(projectsDir, file), "utf8"));

    const empty = PROJECT_FIELDS.filter((f) => String(data[f] ?? "").trim() === "");
    if (empty.length > 0) report(rel, `champ(s) encore vide(s) : ${empty.join(", ")}`);

    const status = String(data.status ?? "").trim();
    if (status !== "" && !KNOWN_STATUSES.includes(status)) {
      report(rel, `status "${status}" sans couleur dédiée — pastille neutre (connus : ${KNOWN_STATUSES.join(" | ")})`);
    }

    for (const [i, link] of (Array.isArray(data.links) ? data.links : []).entries()) {
      if (!String(link?.label ?? "").trim() || !String(link?.href ?? "").trim()) {
        report(rel, `links[${i}] incomplet (label + href requis) — lien masqué`);
      }
    }
  }
}

// 6. Expériences : mêmes trous que les projets, plus la bulle du Laboratory.
const EXPERIMENT_FIELDS = ["name", "category", "status", "year", "description", "idea", "learnings"];
const KNOWN_EXPERIMENT_STATUSES = ["Prototype", "Ongoing", "Paused", "Abandoned"];
const ACCENTS = ["green", "cyan", "yellow", "red", "violet"];

if (fs.existsSync(experimentsDir)) {
  for (const file of fs.readdirSync(experimentsDir).filter((f) => f.endsWith(".md"))) {
    const rel = path.join("content", "experiments", file);
    const { data } = matter(fs.readFileSync(path.join(experimentsDir, file), "utf8"));

    const empty = EXPERIMENT_FIELDS.filter((f) => String(data[f] ?? "").trim() === "");
    if (empty.length > 0) report(rel, `champ(s) encore vide(s) : ${empty.join(", ")}`);

    const status = String(data.status ?? "").trim();
    if (status !== "" && !KNOWN_EXPERIMENT_STATUSES.includes(status)) {
      report(rel, `status "${status}" sans couleur dédiée — pastille neutre (connus : ${KNOWN_EXPERIMENT_STATUSES.join(" | ")})`);
    }

    const accent = String(data.accent ?? "").trim();
    if (accent !== "" && !ACCENTS.includes(accent)) {
      report(rel, `accent "${accent}" inconnu — la bulle retombe sur violet (connus : ${ACCENTS.join(" | ")})`);
    }

    // Hors de 0-100, la bulle sort du cadre du graphe et devient inatteignable.
    for (const axis of ["x", "y"]) {
      const value = data[axis];
      if (value === undefined || value === null || value === "") continue;
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        report(rel, `${axis} = ${value} : position hors du cadre (0-100)`);
      }
    }
  }
}

if (findings.length === 0) {
  console.log("✓ Aucun contenu placeholder détecté — prêt pour le lancement.");
  process.exit(0);
}

console.log(`${findings.length} élément(s) de contenu à finaliser avant lancement :\n`);
const grouped = findings.reduce((acc, f) => {
  (acc[f.file] ??= []).push(f.message);
  return acc;
}, {});
for (const [file, messages] of Object.entries(grouped)) {
  console.log(`  ${file}`);
  for (const m of [...new Set(messages)]) console.log(`    - ${m}`);
}
process.exit(1);
