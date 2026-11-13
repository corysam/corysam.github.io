// @vitest-environment node
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getExperiments, getLab, getProfile, getProjects, getRecommendations, getStack } from "@/lib/content";

const dirs: string[] = [];

/** Crée une arborescence content/ jetable et renvoie son chemin. */
function makeContentDir(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "content-"));
  dirs.push(dir);
  for (const [rel, body] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body, "utf8");
  }
  return dir;
}

const projectMd = (over: Record<string, unknown> = {}) => {
  const fields: Record<string, unknown> = {
    name: "Alpha",
    status: "Delivered",
    role: "Développeur",
    description: "Une description.",
    mission: "Une mission.",
    problem: "Un problème.",
    method: "Une méthode.",
    result: "Un résultat.",
    ...over,
  };
  const body = Object.entries(fields)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join("\n");
  return `---\n${body}\n---\n`;
};

const experimentMd = (over: Record<string, unknown> = {}) => {
  const fields: Record<string, unknown> = {
    name: "Automates",
    label: "Automata",
    category: "Simulation",
    accent: "violet",
    x: 22,
    y: 28,
    status: "Prototype",
    year: "2025",
    description: "Une description.",
    idea: "Une envie de départ.",
    learnings: "Un apprentissage.",
    nextSteps: "Une suite possible.",
    ...over,
  };
  const body = Object.entries(fields)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join("\n");
  return `---\n${body}\n---\n`;
};

afterEach(() => {
  while (dirs.length) fs.rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("getProjects", () => {
  it("trie les projets par 'order'", () => {
    const dir = makeContentDir({
      "projects/b.md": projectMd({ name: "B", order: 2 }),
      "projects/a.md": projectMd({ name: "A", order: 1 }),
      "projects/c.md": projectMd({ name: "C", order: 0 }),
    });
    expect(getProjects(dir).map((p) => p.name)).toEqual(["C", "A", "B"]);
  });

  it("déduit l'id du nom de fichier et applique les valeurs par défaut", () => {
    const dir = makeContentDir({ "projects/mon-projet.md": projectMd() });
    const [p] = getProjects(dir);
    expect(p.id).toBe("mon-projet");
    expect(p.links).toEqual([]);
    expect(p.images).toEqual([]);
    expect(p.order).toBe(999);
  });

  it("ignore les fichiers non-markdown", () => {
    const dir = makeContentDir({
      "projects/a.md": projectMd(),
      "projects/notes.txt": "pas un projet",
    });
    expect(getProjects(dir)).toHaveLength(1);
  });
});

// Le contenu s'écrit au fil de l'eau : un projet à moitié rempli doit se charger
// (le champ vide ne s'affiche simplement pas), pas casser le build.
// `npm run check:content` reste le garde-fou qui signale ce qui manque.
describe("getProjects — contenu incomplet", () => {
  const emptyFrontmatter =
    "---\nname:\nstatus:\nrole:\ndescription:\nmission:\nproblem:\nmethod:\nresult:\nlinks:\nimages:\n---\n";

  it("charge un projet dont un champ est vide au lieu de planter", () => {
    const dir = makeContentDir({ "projects/a.md": projectMd({ mission: "", problem: undefined }) });

    const [p] = getProjects(dir);

    expect(p.mission).toBe("");
    expect(p.problem).toBe("");
    expect(p.description).toBe("Une description.");
  });

  it("charge un projet dont le frontmatter est entièrement vide", () => {
    const dir = makeContentDir({ "projects/movies-reco.md": emptyFrontmatter });

    const [p] = getProjects(dir);

    expect(p.id).toBe("movies-reco");
    expect(p.status).toBe("");
    expect(p.role).toBe("");
    expect(p.mission).toBe("");
    expect(p.links).toEqual([]);
    expect(p.images).toEqual([]);
    expect(p.order).toBe(999);
  });

  // Une carte sans titre serait un rectangle vide impossible à identifier :
  // l'id du fichier sert de nom de repli.
  it("retombe sur l'id du fichier quand le nom est vide", () => {
    const dir = makeContentDir({ "projects/movies-reco.md": emptyFrontmatter });
    expect(getProjects(dir)[0].name).toBe("Movies Reco");
  });

  it("conserve un status hors liste au lieu de le rejeter", () => {
    const dir = makeContentDir({ "projects/a.md": projectMd({ status: "Work in Progress" }) });
    expect(getProjects(dir)[0].status).toBe("Work in Progress");
  });

  it("normalise les valeurs en texte et retire les espaces superflus", () => {
    const dir = makeContentDir({
      "projects/a.md": projectMd({ role: "  Développeur  ", result: 42, method: null }),
    });

    const [p] = getProjects(dir);

    expect(p.role).toBe("Développeur");
    expect(p.result).toBe("42");
    expect(p.method).toBe("");
  });

  it("écarte les liens auxquels il manque un libellé ou une URL", () => {
    const dir = makeContentDir({
      "projects/a.md": projectMd({
        links: [
          { label: "Demo", href: "https://example.com/demo" },
          { label: "GitHub" },
          { href: "https://example.com/orphelin" },
          { label: "  ", href: "  " },
        ],
      }),
    });

    expect(getProjects(dir)[0].links).toEqual([
      { label: "Demo", href: "https://example.com/demo" },
    ]);
  });

  it("écarte les images vides", () => {
    const dir = makeContentDir({
      "projects/a.md": projectMd({ images: ["/a.svg", "", null, "  "] }),
    });
    expect(getProjects(dir)[0].images).toEqual(["/a.svg"]);
  });

  it("ignore un 'order' non numérique plutôt que de casser le tri", () => {
    const dir = makeContentDir({
      "projects/a.md": projectMd({ name: "A", order: "pas un nombre" }),
      "projects/b.md": projectMd({ name: "B", order: 1 }),
    });
    expect(getProjects(dir).map((p) => p.name)).toEqual(["B", "A"]);
  });
});

describe("getExperiments", () => {
  it("trie les expériences par 'order'", () => {
    const dir = makeContentDir({
      "experiments/b.md": experimentMd({ name: "B", order: 2 }),
      "experiments/a.md": experimentMd({ name: "A", order: 1 }),
      "experiments/c.md": experimentMd({ name: "C", order: 0 }),
    });
    expect(getExperiments(dir).map((e) => e.name)).toEqual(["C", "A", "B"]);
  });

  it("déduit l'id du nom de fichier et lit les champs de la bulle", () => {
    const dir = makeContentDir({ "experiments/cellular-automata.md": experimentMd() });

    const [e] = getExperiments(dir);

    expect(e.id).toBe("cellular-automata");
    expect(e.name).toBe("Automates");
    expect(e.label).toBe("Automata");
    expect(e.category).toBe("Simulation");
    expect(e.accent).toBe("violet");
    expect(e.x).toBe(22);
    expect(e.y).toBe(28);
    expect(e.status).toBe("Prototype");
    expect(e.year).toBe("2025");
    expect(e.idea).toBe("Une envie de départ.");
    expect(e.learnings).toBe("Un apprentissage.");
    expect(e.nextSteps).toBe("Une suite possible.");
  });

  it("ignore les fichiers non-markdown", () => {
    const dir = makeContentDir({
      "experiments/a.md": experimentMd(),
      "experiments/notes.txt": "pas une expérience",
    });
    expect(getExperiments(dir)).toHaveLength(1);
  });

  it("renvoie une liste vide quand le dossier n'existe pas encore", () => {
    const dir = makeContentDir({ "profile.json": "{}" });
    expect(getExperiments(dir)).toEqual([]);
  });

  // La bulle est étroite : `label` porte le texte court, `name` le titre de la
  // modale. Un seul des deux renseigné doit suffire.
  it("retombe sur le nom quand la bulle n'a pas de libellé court", () => {
    const dir = makeContentDir({ "experiments/a.md": experimentMd({ label: "" }) });
    expect(getExperiments(dir)[0].label).toBe("Automates");
  });

  it("retombe sur l'id du fichier quand le nom est vide", () => {
    const dir = makeContentDir({ "experiments/midi-toy.md": experimentMd({ name: "", label: "" }) });

    const [e] = getExperiments(dir);

    expect(e.name).toBe("Midi Toy");
    expect(e.label).toBe("Midi Toy");
  });

  // `accent` pilote directement une variable CSS : une valeur hors liste
  // produirait `var(--color-status-undefined)` dans le style de la bulle.
  it("retombe sur un accent connu quand la couleur est absente ou inconnue", () => {
    const dir = makeContentDir({
      "experiments/a.md": experimentMd({ name: "A", accent: "turquoise", order: 1 }),
      "experiments/b.md": experimentMd({ name: "B", accent: undefined, order: 2 }),
    });

    expect(getExperiments(dir).map((e) => e.accent)).toEqual(["violet", "violet"]);
  });

  // Sans position, la bulle est placée par getLab : le loader ne doit pas
  // inventer une position qui l'épinglerait.
  it("laisse x/y vides quand la position est absente ou invalide", () => {
    const dir = makeContentDir({
      "experiments/a.md": experimentMd({ name: "A", x: undefined, y: undefined, order: 1 }),
      "experiments/b.md": experimentMd({ name: "B", x: "abc", y: "", order: 2 }),
    });

    for (const e of getExperiments(dir)) {
      expect(e.x).toBeUndefined();
      expect(e.y).toBeUndefined();
    }
  });

  it("écarte les technologies vides", () => {
    const dir = makeContentDir({
      "experiments/a.md": experimentMd({ tech: ["Rust", "", null, "  WebGPU  "] }),
    });
    expect(getExperiments(dir)[0].tech).toEqual(["Rust", "WebGPU"]);
  });

  it("charge une expérience au frontmatter entièrement vide", () => {
    const dir = makeContentDir({
      "experiments/midi-toy.md":
        "---\nname:\nlabel:\ncategory:\naccent:\nstatus:\nyear:\ndescription:\nidea:\nlearnings:\nnextSteps:\ntech:\nlinks:\nimages:\n---\n",
    });

    const [e] = getExperiments(dir);

    expect(e.id).toBe("midi-toy");
    expect(e.category).toBe("");
    expect(e.status).toBe("");
    expect(e.idea).toBe("");
    expect(e.tech).toEqual([]);
    expect(e.links).toEqual([]);
    expect(e.images).toEqual([]);
    expect(e.order).toBe(999);
  });

  it("conserve un statut hors liste au lieu de le rejeter", () => {
    const dir = makeContentDir({ "experiments/a.md": experimentMd({ status: "Enterré" }) });
    expect(getExperiments(dir)[0].status).toBe("Enterré");
  });

  it("écarte les liens auxquels il manque un libellé ou une URL", () => {
    const dir = makeContentDir({
      "experiments/a.md": experimentMd({
        links: [
          { label: "Demo", href: "https://example.com/demo" },
          { label: "GitHub" },
        ],
      }),
    });
    expect(getExperiments(dir)[0].links).toEqual([
      { label: "Demo", href: "https://example.com/demo" },
    ]);
  });
});

describe("getLab", () => {
  const experiments = (dir: string) => getExperiments(dir);

  it("conserve les arêtes dont les deux extrémités existent", () => {
    const dir = makeContentDir({
      "experiments/lab-a.md": experimentMd({ name: "A" }),
      "experiments/lab-b.md": experimentMd({ name: "B" }),
      "lab.json": JSON.stringify({ edges: [{ from: "lab-a", to: "lab-b" }] }),
    });

    const lab = getLab(experiments(dir), dir);

    expect(lab.edges).toEqual([["lab-a", "lab-b"]]);
    expect(lab.experiments.map((e) => e.id)).toEqual(["lab-a", "lab-b"]);
  });

  // Régression audit B4 : une arête vers un id inconnu faisait planter toute la page.
  it("ignore une arête vers une expérience inconnue au lieu de planter", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const dir = makeContentDir({
      "experiments/lab-a.md": experimentMd({ name: "A" }),
      "lab.json": JSON.stringify({
        edges: [
          { from: "lab-a", to: "lab-a" },
          { from: "lab-a", to: "fantome" },
        ],
      }),
    });

    const lab = getLab(experiments(dir), dir);

    expect(lab.edges).toEqual([["lab-a", "lab-a"]]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("fantome"));
  });

  // Sans position, toutes les bulles se superposeraient en haut à gauche.
  it("place les bulles sans position, dans le cadre et sans les empiler", () => {
    const dir = makeContentDir({
      "experiments/a.md": experimentMd({ name: "A", x: undefined, y: undefined, order: 1 }),
      "experiments/b.md": experimentMd({ name: "B", x: undefined, y: undefined, order: 2 }),
      "experiments/c.md": experimentMd({ name: "C", x: 30, y: 40, order: 3 }),
      "lab.json": JSON.stringify({ edges: [{ from: "a", to: "b" }] }),
    });

    const [a, b, c] = getLab(experiments(dir), dir).experiments;

    expect([a.x, a.y]).not.toEqual([b.x, b.y]);
    for (const v of [a.x, a.y, b.x, b.y]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
    // Une position manuelle reste prioritaire.
    expect([c.x, c.y]).toEqual([30, 40]);
  });

  // Les bulles vivent maintenant dans content/experiments/ : le graphe doit
  // s'afficher même si personne n'a encore créé de fichier d'arêtes.
  it("se passe d'un lab.json absent", () => {
    const dir = makeContentDir({ "experiments/lab-a.md": experimentMd({ name: "A" }) });

    const lab = getLab(experiments(dir), dir);

    expect(lab.edges).toEqual([]);
    expect(lab.experiments).toHaveLength(1);
  });
});

describe("loaders JSON", () => {
  it("lit stack, recommendations et profile", () => {
    const dir = makeContentDir({
      "stack.json": JSON.stringify({ rows: [{ label: "Back End", accent: "green", items: ["Node.js"] }] }),
      "recommendations.json": JSON.stringify({ items: [{ id: "r1", source: "linkedin", name: "Alice", role: "CTO", text: "Top." }] }),
      "profile.json": JSON.stringify({ name: "Test", resume: null }),
    });
    expect(getStack(dir)[0].items).toEqual(["Node.js"]);
    expect(getRecommendations(dir)[0].name).toBe("Alice");
    expect(getProfile(dir).name).toBe("Test");
  });
});

describe("traductions (fichiers *.en.*)", () => {
  it("lit les textes de la traduction anglaise", () => {
    const dir = makeContentDir({
      "projects/a.md": projectMd({ name: "Alpha", mission: "Une mission." }),
      "projects/a.en.md": projectMd({ name: "Alpha EN", mission: "A mission." }),
    });

    const [p] = getProjects(dir, "en");

    expect(p.name).toBe("Alpha EN");
    expect(p.mission).toBe("A mission.");
    // Le français reste intact.
    expect(getProjects(dir, "fr")[0].mission).toBe("Une mission.");
  });

  it("n'ajoute pas les traductions à la liste des projets", () => {
    const dir = makeContentDir({
      "projects/a.md": projectMd(),
      "projects/a.en.md": projectMd(),
    });
    expect(getProjects(dir).map((p) => p.id)).toEqual(["a"]);
    expect(getProjects(dir, "en").map((p) => p.id)).toEqual(["a"]);
  });

  it("retombe sur le français pour un champ ou un fichier non traduit", () => {
    const dir = makeContentDir({
      "projects/a.md": projectMd({ name: "A", order: 1, problem: "Un problème." }),
      "projects/a.en.md": projectMd({ name: "A", problem: "" }),
      "projects/b.md": projectMd({ name: "B", order: 2, mission: "Mission de B." }),
    });

    const [a, b] = getProjects(dir, "en");

    expect(a.problem).toBe("Un problème.");
    expect(b.mission).toBe("Mission de B.");
  });

  it("prend toujours les champs structurels dans le français", () => {
    const dir = makeContentDir({
      "projects/a.md": projectMd({
        status: "Delivered",
        order: 3,
        images: ["/a.png"],
        links: [{ label: "Site", href: "https://example.com/fr" }],
      }),
      "projects/a.en.md": projectMd({
        status: "Abandoned",
        order: 1,
        images: ["/autre.png"],
        links: [{ label: "Website", href: "https://example.com/en" }],
      }),
    });

    const [p] = getProjects(dir, "en");

    expect(p.status).toBe("Delivered");
    expect(p.order).toBe(3);
    expect(p.images).toEqual(["/a.png"]);
    expect(p.links).toEqual([{ label: "Website", href: "https://example.com/fr" }]);
  });

  it("traduit les expériences sans toucher à la bulle", () => {
    const dir = makeContentDir({
      "experiments/a.md": experimentMd({ name: "Automates", category: "Simulation", accent: "cyan", x: 10 }),
      "experiments/a.en.md": experimentMd({ name: "Automata", label: "", category: "Sim", idea: "A wish.", accent: "red", x: 90 }),
    });

    const [e] = getExperiments(dir, "en");

    expect(e.name).toBe("Automata");
    expect(e.category).toBe("Sim");
    expect(e.idea).toBe("A wish.");
    // label vide dans la traduction : le libellé court du français reste prioritaire sur le nom.
    expect(e.label).toBe("Automata");
    expect(e.accent).toBe("cyan");
    expect(e.x).toBe(10);
    expect(getExperiments(dir).map((x) => x.id)).toEqual(["a"]);
  });

  it("traduit profil, stack et recommandations en gardant la structure du français", () => {
    const dir = makeContentDir({
      "profile.json": JSON.stringify({
        name: "Test",
        email: "fr@example.com",
        resume: null,
        tagline: "Accroche.",
        about: ["Paragraphe."],
        expertises: ["Agents LLM"],
      }),
      "profile.en.json": JSON.stringify({ name: "Ignored", email: "en@example.com", tagline: "Tagline.", about: [], expertises: ["LLM agents"] }),
      "stack.json": JSON.stringify({ rows: [{ label: "IA", accent: "cyan", items: ["n8n"] }] }),
      "stack.en.json": JSON.stringify({ rows: [{ label: "AI", accent: "red", items: [] }] }),
      "recommendations.json": JSON.stringify({ items: [{ id: "r1", source: "malt", name: "Alice", role: "Présidente", text: "Top." }] }),
      "recommendations.en.json": JSON.stringify({ items: [{ id: "r1", source: "linkedin", name: "Bob", role: "President", text: "" }] }),
    });

    const profile = getProfile(dir, "en");
    expect(profile.name).toBe("Test");
    expect(profile.email).toBe("fr@example.com");
    expect(profile.tagline).toBe("Tagline.");
    expect(profile.about).toEqual(["Paragraphe."]);
    expect(profile.expertises).toEqual(["LLM agents"]);

    expect(getStack(dir, "en")).toEqual([{ label: "AI", accent: "cyan", items: ["n8n"] }]);

    expect(getRecommendations(dir, "en")).toEqual([
      { id: "r1", source: "malt", name: "Alice", role: "President", text: "Top." },
    ]);
  });

  it("charge la version anglaise sans aucun fichier de traduction", () => {
    const dir = makeContentDir({
      "projects/a.md": projectMd(),
      "stack.json": JSON.stringify({ rows: [{ label: "Back End", accent: "green", items: ["Node.js"] }] }),
      "profile.json": JSON.stringify({ name: "Test", resume: null, about: ["Un."], expertises: [] }),
    });
    expect(getProjects(dir, "en")[0].mission).toBe("Une mission.");
    expect(getStack(dir, "en")[0].label).toBe("Back End");
    expect(getProfile(dir, "en").about).toEqual(["Un."]);
  });
});

describe("contenu réel du dépôt", () => {
  // Garde-fou : le contenu livré doit toujours passer la validation.
  it("content/ est valide", () => {
    const projects = getProjects();
    expect(projects.length).toBeGreaterThan(0);
    // Les bulles du Laboratory sont désormais des expériences.
    expect(getExperiments().length).toBeGreaterThan(0);
    expect(() => getLab(getExperiments())).not.toThrow();
    expect(getStack().length).toBeGreaterThan(0);
    expect(getProfile().name).toBeTruthy();
  });

  // Une traduction manquante n'est qu'un avertissement de `check:content` : elle
  // ne doit jamais bloquer le déploiement d'un projet tout juste ajouté au CMS.
  it("la version anglaise se charge et liste les mêmes entrées", () => {
    expect(getProjects(undefined, "en").map((p) => p.id)).toEqual(getProjects().map((p) => p.id));
    expect(getExperiments(undefined, "en").map((e) => e.id)).toEqual(getExperiments().map((e) => e.id));
    expect(getProfile(undefined, "en").about.length).toBeGreaterThan(0);
  });
});
