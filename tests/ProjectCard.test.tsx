import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectCard } from "@/components/ProjectCard";
import { emptyProject, makeProject } from "./fixtures";

describe("ProjectCard", () => {
  it("affiche le statut, le nom, le rôle et la description quand tout est rempli", () => {
    const p = makeProject();
    render(<ProjectCard project={p} onOpen={vi.fn()} />);

    expect(screen.getByText("Livré")).toBeInTheDocument();
    expect(screen.getByText(p.name)).toBeInTheDocument();
    expect(screen.getByText(p.role)).toBeInTheDocument();
    expect(screen.getByText(p.description)).toBeInTheDocument();
  });

  it("affiche un statut libre tel quel", () => {
    render(<ProjectCard project={makeProject({ status: "Work in Progress" })} onOpen={vi.fn()} />);
    expect(screen.getByText("Work in Progress")).toBeInTheDocument();
  });

  // Le cœur de la résilience : un champ vide n'affiche rien — pas un bloc vide.
  it("n'affiche que le nom quand tous les autres champs sont vides", () => {
    render(<ProjectCard project={emptyProject} onOpen={vi.fn()} />);

    const card = screen.getByRole("button");
    expect(card.textContent).toBe("Movies Reco");
    expect(card.querySelectorAll("p")).toHaveLength(0);
  });

  it("reste cliquable même sans aucun champ rempli", async () => {
    const onOpen = vi.fn();
    render(<ProjectCard project={emptyProject} onOpen={onOpen} />);

    await userEvent.click(screen.getByRole("button"));

    expect(onOpen).toHaveBeenCalledWith(emptyProject);
  });
});
