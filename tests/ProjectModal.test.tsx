import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectModal } from "@/components/ProjectModal";
import { emptyProject, makeProject } from "./fixtures";

const twoLinks = makeProject({
  links: [
    { label: "Demo", href: "https://example.com/demo" },
    { label: "GitHub", href: "https://example.com/repo" },
  ],
});

describe("ProjectModal", () => {
  it("ne rend rien sans projet", () => {
    const { container } = render(<ProjectModal project={null} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("expose une sémantique de dialogue nommée par le titre du projet", () => {
    render(<ProjectModal project={makeProject()} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Alpha");
  });

  it("affiche le nom, le rôle et les quatre rubriques", () => {
    const p = makeProject();
    render(<ProjectModal project={p} onClose={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(p.name);
    expect(screen.getByText(p.role)).toBeInTheDocument();
    for (const label of ["Mission", "Problème", "Méthode", "Résultat"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText(p.mission)).toBeInTheDocument();
  });

  // Régression audit B3 : seul links[0] était rendu, les autres étaient perdus.
  it("rend TOUS les liens du projet, pas seulement le premier", () => {
    render(<ProjectModal project={twoLinks} onClose={vi.fn()} />);

    expect(screen.getByRole("link", { name: "Demo" })).toHaveAttribute(
      "href",
      "https://example.com/demo"
    );
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://example.com/repo"
    );
  });

  it("n'affiche aucun lien quand le projet n'en a pas", () => {
    render(<ProjectModal project={makeProject({ links: [] })} onClose={vi.fn()} />);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("ferme via la touche Échap", async () => {
    const onClose = vi.fn();
    render(<ProjectModal project={makeProject()} onClose={onClose} />);

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });

  it("ferme via le bouton de fermeture", async () => {
    const onClose = vi.fn();
    render(<ProjectModal project={makeProject()} onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "Fermer" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("ferme au clic sur le fond mais pas au clic dans la carte", async () => {
    const onClose = vi.fn();
    render(<ProjectModal project={makeProject()} onClose={onClose} />);

    await userEvent.click(screen.getByRole("heading", { level: 2 }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("verrouille le scroll du body à l'ouverture et le restaure à la fermeture", () => {
    const { rerender } = render(<ProjectModal project={makeProject()} onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<ProjectModal project={null} onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe("");
  });

  // Résilience : une rubrique vide disparaît, elle ne laisse pas un libellé orphelin.
  it("masque les rubriques vides et ne garde que celles renseignées", () => {
    render(
      <ProjectModal
        project={makeProject({ mission: "La mission.", problem: "", method: "", result: "" })}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("Mission")).toBeInTheDocument();
    expect(screen.getByText("La mission.")).toBeInTheDocument();
    for (const label of ["Problème", "Méthode", "Résultat"]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });

  it("s'ouvre sur un projet entièrement vide sans rubrique ni statut", () => {
    render(<ProjectModal project={emptyProject} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toHaveAccessibleName("Movies Reco");
    for (const label of ["Mission", "Problème", "Méthode", "Résultat"]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  it("écarte un lien sans URL au lieu de rendre une ancre morte", () => {
    render(
      <ProjectModal
        project={makeProject({
          links: [
            { label: "Demo", href: "https://example.com/demo" },
            { label: "Orphelin", href: "" },
          ],
        })}
        onClose={vi.fn()}
      />
    );

    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.queryByText("Orphelin")).not.toBeInTheDocument();
  });

  it("affiche les images du projet avec un alt utile", () => {
    render(
      <ProjectModal project={makeProject({ images: ["/a.svg", "/b.svg"] })} onClose={vi.fn()} />
    );
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(screen.getByAltText("Alpha aperçu 1")).toBeInTheDocument();
  });
});
