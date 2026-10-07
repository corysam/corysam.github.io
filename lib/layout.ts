// Placement automatique des bulles du Laboratory — build-time uniquement.
//
// Graphe dirigé par forces (d3-force) : les liaisons rapprochent les bulles
// (fortement au sein d'une catégorie, faiblement entre catégories), toutes les
// bulles se repoussent, et chaque catégorie attire ses bulles vers son propre
// point d'ancrage — d'où des grappes par catégorie reliées entre elles.
// Une bulle qui porte un x/y manuel est épinglée et sert de repère à sa grappe.

import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import type { Experiment, PlacedExperiment } from "./types";

// Espace de simulation calqué sur le conteneur desktop (h-[420px], pleine
// largeur), mais étiré ×2 en hauteur : une bulle est une pilule bien plus
// large que haute, et les forces de d3 sont circulaires. Dans cet espace, un
// écart vertical « coûte » le double, et les grappes s'étalent en largeur.
const W = 1000;
const H = 420 * 2;
// Cadre où une bulle calculée peut atterrir, en % : la bulle est centrée sur
// sa position, il faut garder de quoi l'afficher entière.
const X_BOUNDS = [10, 90] as const;
const Y_BOUNDS = [12, 88] as const;
const TICKS = 300;

type Node = SimulationNodeDatum & { id: string; category: string };
type Link = SimulationLinkDatum<Node> & { sameCategory: boolean };

const clamp = (v: number, [min, max]: readonly [number, number]) => Math.min(max, Math.max(min, v));
const round = (v: number) => Math.round(v * 10) / 10;
const isPinned = (e: Experiment) => e.x !== undefined && e.y !== undefined;

/** Point d'ancrage de chaque catégorie, en px de simulation. */
function categoryAnchors(experiments: Experiment[]) {
  // `experiments` arrive trié par `order` : l'ordre des grappes suit celui des fiches.
  const categories = [...new Set(experiments.map((e) => e.category))];
  // Chaque grappe reçoit une part de la largeur proportionnelle à √(nombre de
  // bulles) : une grosse grappe a la place de s'étaler sans écraser les petites.
  const weights = categories.map((c) => Math.sqrt(experiments.filter((e) => e.category === c).length));
  const total = weights.reduce((sum, w) => sum + w, 0);
  const [xMin, xMax] = X_BOUNDS.map((v) => (v / 100) * W);
  let before = 0;

  return new Map(
    categories.map((category, i) => {
      const pinned = experiments.filter((e) => e.category === category && isPinned(e));
      const share = (before + weights[i] / 2) / total;
      before += weights[i];
      if (pinned.length > 0) {
        // Une nouvelle bulle rejoint ses voisines placées à la main.
        const cx = pinned.reduce((sum, e) => sum + e.x!, 0) / pinned.length;
        const cy = pinned.reduce((sum, e) => sum + e.y!, 0) / pinned.length;
        return [category, { x: (cx / 100) * W, y: (cy / 100) * H }];
      }
      // Grappes réparties sur la largeur (le conteneur est très large),
      // légèrement décalées en hauteur une sur deux.
      const x = xMin + share * (xMax - xMin);
      const y = categories.length === 1 ? H / 2 : H / 2 + (i % 2 === 0 ? -1 : 1) * H * 0.06;
      return [category, { x, y }];
    }),
  );
}

export function layoutLab(experiments: Experiment[], edges: [string, string][]): PlacedExperiment[] {
  if (experiments.every(isPinned)) return experiments as PlacedExperiment[];

  const anchors = categoryAnchors(experiments);

  // Départ déterministe autour de l'ancre, en spirale à angle d'or (même
  // contenu, même graphe à chaque build). Les bulles les plus reliées partent
  // au centre de leur grappe : un hub placé en périphérie y resterait coincé.
  const degree = new Map<string, number>();
  for (const [a, b] of edges) {
    degree.set(a, (degree.get(a) ?? 0) + 1);
    degree.set(b, (degree.get(b) ?? 0) + 1);
  }
  const rank = new Map<string, number>();
  const counters = new Map<string, number>();
  for (const e of [...experiments].sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0))) {
    const k = counters.get(e.category) ?? 0;
    counters.set(e.category, k + 1);
    rank.set(e.id, k);
  }

  const nodes: Node[] = experiments.map((e) => {
    const anchor = anchors.get(e.category)!;
    if (isPinned(e)) {
      const x = (e.x! / 100) * W;
      const y = (e.y! / 100) * H;
      return { id: e.id, category: e.category, x, y, fx: x, fy: y };
    }
    const k = rank.get(e.id)!;
    const angle = k * 2.39996;
    const radius = 80 * Math.sqrt(k);
    return {
      id: e.id,
      category: e.category,
      x: anchor.x + Math.cos(angle) * radius,
      y: anchor.y + Math.sin(angle) * radius,
    };
  });

  const categoryOf = new Map(nodes.map((n) => [n.id, n.category]));
  const links: Link[] = edges
    .filter(([a, b]) => a !== b)
    .map(([a, b]) => ({ source: a, target: b, sameCategory: categoryOf.get(a) === categoryOf.get(b) }));

  const simulation = forceSimulation(nodes)
    .force(
      "link",
      forceLink<Node, Link>(links)
        .id((n) => n.id)
        .distance(200)
        .strength((l) => (l.sameCategory ? 0.8 : 0.1)),
    )
    .force("charge", forceManyBody().strength(-500))
    .force("collide", forceCollide(100))
    .force("clusterX", forceX<Node>((n) => anchors.get(n.category)!.x).strength(0.15))
    .force("clusterY", forceY<Node>((n) => anchors.get(n.category)!.y).strength(0.08))
    .stop();

  const xMin = (X_BOUNDS[0] / 100) * W;
  const xMax = (X_BOUNDS[1] / 100) * W;
  const yMin = (Y_BOUNDS[0] / 100) * H;
  const yMax = (Y_BOUNDS[1] / 100) * H;
  for (let i = 0; i < TICKS; i++) {
    simulation.tick();
    // Les murs participent à la simulation : une grappe poussée contre un bord
    // se réorganise au lieu de déborder du cadre.
    for (const n of nodes) {
      n.x = clamp(n.x!, [xMin, xMax]);
      n.y = clamp(n.y!, [yMin, yMax]);
    }
  }

  return experiments.map((e, i) =>
    isPinned(e)
      ? (e as PlacedExperiment)
      : { ...e, x: round((nodes[i].x! / W) * 100), y: round((nodes[i].y! / H) * 100) },
  );
}
