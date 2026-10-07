// @vitest-environment node
import { describe, expect, it } from "vitest";
import { layoutLab } from "@/lib/layout";
import type { Experiment, PlacedExperiment } from "@/lib/types";
import { makeExperiment } from "./fixtures";

/** Expérience sans position : c'est au layout de la placer. */
const free = (id: string, category: string, order = 1): Experiment => ({
  ...makeExperiment({ id, category, order }),
  x: undefined,
  y: undefined,
});

// Distances en px du conteneur desktop (1000 × 420) : en %, un écart
// horizontal et un écart vertical ne se comparent pas.
const dist = (a: PlacedExperiment, b: PlacedExperiment) => Math.hypot((a.x - b.x) * 10, (a.y - b.y) * 4.2);

const centroid = (nodes: PlacedExperiment[]) => ({
  x: nodes.reduce((s, n) => s + n.x, 0) / nodes.length,
  y: nodes.reduce((s, n) => s + n.y, 0) / nodes.length,
});

const byId = (nodes: PlacedExperiment[]) => Object.fromEntries(nodes.map((n) => [n.id, n]));

describe("layoutLab", () => {
  it("rapproche deux bulles liées de même catégorie, à l'écart d'une autre catégorie", () => {
    const { a, b, c } = byId(
      layoutLab([free("a", "IA", 1), free("b", "IA", 2), free("c", "Web", 3)], [["a", "b"]]),
    );

    expect(dist(a, b)).toBeLessThan(dist(a, c));
    expect(dist(a, b)).toBeLessThan(dist(b, c));
  });

  it("regroupe les bulles par catégorie", () => {
    const experiments = [
      free("ia1", "IA", 1),
      free("web1", "Web", 2),
      free("ia2", "IA", 3),
      free("web2", "Web", 4),
      free("ia3", "IA", 5),
      free("web3", "Web", 6),
    ];
    const edges: [string, string][] = [
      ["ia1", "ia2"],
      ["ia2", "ia3"],
      ["web1", "web2"],
      ["web2", "web3"],
      ["ia1", "web1"],
    ];

    const placed = layoutLab(experiments, edges);
    const ia = placed.filter((e) => e.category === "IA");
    const web = placed.filter((e) => e.category === "Web");
    const ciA = centroid(ia);
    const cWeb = centroid(web);
    const d = (n: PlacedExperiment, c: { x: number; y: number }) => Math.hypot((n.x - c.x) * 10, (n.y - c.y) * 4.2);

    // Chaque bulle est plus proche du centre de sa grappe que de celui de l'autre.
    for (const n of ia) expect(d(n, ciA)).toBeLessThan(d(n, cWeb));
    for (const n of web) expect(d(n, cWeb)).toBeLessThan(d(n, ciA));
  });

  it("garde exactement la position d'une bulle épinglée", () => {
    const pinned = makeExperiment({ id: "p", category: "IA", x: 33, y: 44 });

    const { p } = byId(layoutLab([pinned, free("a", "IA", 2)], [["p", "a"]]));

    expect([p.x, p.y]).toEqual([33, 44]);
  });

  it("produit le même graphe à chaque build", () => {
    const experiments = [free("a", "IA", 1), free("b", "IA", 2), free("c", "Web", 3), free("d", "Web", 4)];
    const edges: [string, string][] = [
      ["a", "b"],
      ["b", "c"],
      ["c", "d"],
    ];

    expect(layoutLab(experiments, edges)).toEqual(layoutLab(experiments, edges));
  });

  it("garde toutes les bulles dans le cadre et sans superposition", () => {
    const experiments = Array.from({ length: 12 }, (_, i) => free(`n${i}`, i % 3 === 0 ? "A" : "B", i));
    const edges = experiments.slice(1).map((e) => ["n0", e.id] as [string, string]);

    const placed = layoutLab(experiments, edges);

    for (const n of placed) {
      expect(n.x).toBeGreaterThanOrEqual(10);
      expect(n.x).toBeLessThanOrEqual(90);
      expect(n.y).toBeGreaterThanOrEqual(12);
      expect(n.y).toBeLessThanOrEqual(88);
    }
    const positions = new Set(placed.map((n) => `${n.x},${n.y}`));
    expect(positions.size).toBe(placed.length);
  });

  it("supporte un graphe vide ou une bulle seule", () => {
    expect(layoutLab([], [])).toEqual([]);

    const [only] = layoutLab([free("a", "")], []);
    expect(only.x).toBeGreaterThanOrEqual(10);
    expect(only.x).toBeLessThanOrEqual(90);
  });
});
