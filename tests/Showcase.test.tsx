import { describe, expect, it } from "vitest";
import { render, screen, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Showcase } from "@/components/Showcase";
import { experimentA, experimentB, gridProject, lab, makeProject } from "./fixtures";

const projects = [
  gridProject,
  makeProject({ id: "beta", name: "Beta", description: "Description de Beta.", order: 2 }),
];

const renderShowcase = () => render(<Showcase projects={projects} lab={lab} />);

/**
 * Laboratory rend chaque bulle deux fois (desktop + mobile, séparés par CSS).
 * jsdom n'applique pas les media queries : on cible donc la première.
 */
const clickBubble = (name: RegExp) => userEvent.click(screen.getAllByRole("button", { name })[0]);

describe("Showcase", () => {
  // Les bulles ne pointent plus vers des projets : la grille n'a plus rien à filtrer.
  it("affiche tous les projets dans la grille Project", () => {
    renderShowcase();
    const grid = document.getElementById("project")!;

    expect(grid.textContent).toContain("Alpha");
    expect(grid.textContent).toContain("Beta");
  });

  it("garde les expériences hors de la grille Project", () => {
    renderShowcase();
    const grid = document.getElementById("project")!;

    expect(grid.textContent).not.toContain(experimentA.name);
    expect(grid.textContent).not.toContain(experimentB.name);
  });

  it("ouvre la modale projet avec le projet de la carte cliquée", async () => {
    renderShowcase();

    await userEvent.click(screen.getByRole("button", { name: /Alpha/ }));

    expect(await screen.findByRole("dialog")).toHaveAccessibleName("Alpha");
  });

  // Le cœur du changement : une bulle du Laboratory ouvre une fiche
  // d'expérience, pas une fiche projet.
  it("ouvre la fiche d'expérience — et non la fiche projet — depuis une bulle", async () => {
    renderShowcase();

    await clickBubble(/Bulle A/);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAccessibleName(experimentA.name);
    // Rubriques d'expérience, absentes d'une fiche projet.
    expect(screen.getByText("Idea")).toBeInTheDocument();
    expect(screen.queryByText("Mission")).not.toBeInTheDocument();
  });

  it("chaque bulle ouvre SON propre expérience", async () => {
    renderShowcase();

    await clickBubble(/Bulle A/);
    expect(await screen.findByRole("dialog")).toHaveAccessibleName(experimentA.name);

    await userEvent.click(screen.getByRole("button", { name: "Fermer" }));
    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));

    await clickBubble(/Bulle B/);
    expect(await screen.findByRole("dialog")).toHaveAccessibleName(experimentB.name);
  });

  it("referme la fiche d'expérience avec Échap", async () => {
    renderShowcase();
    await clickBubble(/Bulle A/);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    // AnimatePresence garde la modale montée pendant son animation de sortie.
    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));
  });

  it("referme la fiche projet avec Échap", async () => {
    renderShowcase();
    await userEvent.click(screen.getByRole("button", { name: /Alpha/ }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));
  });

  // Projet et expérience partagent un seul état : ouvrir l'une referme l'autre.
  // Sans ça, deux dialogues `aria-modal` resteraient ouverts en même temps.
  it("ne laisse qu'une seule fiche ouverte quand on passe de l'une à l'autre", async () => {
    renderShowcase();

    await userEvent.click(screen.getByRole("button", { name: /Alpha/ }));
    await screen.findByRole("dialog");
    await clickBubble(/Bulle A/);

    // La fiche projet sort en animation : on attend qu'elle soit démontée.
    await waitFor(() => expect(screen.getAllByRole("dialog")).toHaveLength(1));
    expect(screen.getByRole("dialog")).toHaveAccessibleName(experimentA.name);
  });

  it("n'affiche aucune fiche au premier rendu", () => {
    renderShowcase();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
