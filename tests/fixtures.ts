import type { Experiment, Lab, Profile, Project, Recommendation, StackRow } from "@/lib/types";

// Contenu de test volontairement indépendant de content/ : les tests doivent
// rester verts quand le vrai contenu du portfolio change.

export const makeProject = (over: Partial<Project> = {}): Project => ({
  id: "alpha",
  name: "Alpha",
  status: "Delivered",
  role: "Développeur",
  description: "Description d'Alpha.",
  mission: "Mission d'Alpha.",
  problem: "Problème d'Alpha.",
  method: "Méthode d'Alpha.",
  result: "Résultat d'Alpha.",
  order: 1,
  links: [],
  images: [],
  ...over,
});

export const gridProject = makeProject({ id: "alpha", name: "Alpha" });

export const makeExperiment = (over: Partial<Experiment> = {}): Experiment => ({
  id: "lab-a",
  name: "Automates cellulaires",
  label: "Automata",
  category: "Simulation",
  accent: "violet",
  x: 20,
  y: 30,
  order: 1,
  status: "Prototype",
  year: "2025",
  description: "Une grille qui s'anime toute seule.",
  idea: "Voir si je pouvais écrire la règle 110 en une soirée.",
  learnings: "Le rendu par canvas coûte moins cher que le DOM.",
  nextSteps: "Ajouter un éditeur de règles.",
  tech: ["TypeScript", "Canvas"],
  links: [],
  images: [],
  ...over,
});

export const experimentA = makeExperiment({ id: "lab-a", name: "Lab A", label: "Bulle A" });

export const experimentB = makeExperiment({
  id: "lab-b",
  name: "Lab B",
  label: "Bulle B",
  category: "Jeu",
  accent: "red",
  x: 70,
  y: 60,
  order: 2,
});

export const lab: Lab = {
  experiments: [experimentA, experimentB],
  edges: [["lab-a", "lab-b"]],
};

export const profile: Profile = {
  name: "Test Person",
  tagline: "Tagline de test.",
  email: "test@example.com",
  phone: "+33 6 00 00 00 00",
  linkedin: "https://www.linkedin.com/in/test",
  resume: null,
  about: ["Paragraphe un.", "Paragraphe deux."],
  expertises: ["React", "Node.js"],
};

export const stack: StackRow[] = [
  { label: "Back End", accent: "green", items: ["Node.js", "Express"] },
  { label: "Front End", accent: "cyan", items: ["React"] },
];

export const recommendations: Recommendation[] = [
  { id: "r1", source: "linkedin", name: "Alice", role: "CTO", text: "Très bon travail." },
  { id: "r2", source: "malt", name: "Bob", role: "Product Owner", text: "Mission au top." },
];

/** Projet tout juste créé : seul le fichier existe, aucun champ n'est rempli. */
export const emptyProject = makeProject({
  id: "movies-reco",
  name: "Movies Reco",
  status: "",
  role: "",
  description: "",
  mission: "",
  problem: "",
  method: "",
  result: "",
});
