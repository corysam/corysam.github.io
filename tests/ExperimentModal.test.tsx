import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExperimentModal } from "@/components/ExperimentModal";
import { makeExperiment } from "./fixtures";

describe("ExperimentModal", () => {
  it("ne rend rien sans expérience", () => {
    const { container } = render(<ExperimentModal experiment={null} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("expose une sémantique de dialogue nommée par le titre de l'expérience", () => {
    render(<ExperimentModal experiment={makeExperiment()} onClose={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Automates cellulaires");
  });

  // Les rubriques d'un side project : ni mission ni livrable, mais l'envie de
  // départ, ce que ça a appris et ce qu'il resterait à faire.
  it("affiche les rubriques propres à une expérience", () => {
    const e = makeExperiment();
    render(<ExperimentModal experiment={e} onClose={vi.fn()} />);

    for (const label of ["Description", "Idea", "Learnings", "Next steps"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText(e.idea)).toBeInTheDocument();
    expect(screen.getByText(e.learnings)).toBeInTheDocument();
    expect(screen.getByText(e.nextSteps)).toBeInTheDocument();
  });

  // Une expérience inachevée est souvent à moitié documentée : un intitulé
  // sans texte donnerait l'impression d'une fiche cassée.
  it("masque les rubriques non renseignées", () => {
    render(
      <ExperimentModal
        experiment={makeExperiment({ learnings: "", nextSteps: "" })}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("Idea")).toBeInTheDocument();
    expect(screen.queryByText("Learnings")).not.toBeInTheDocument();
    expect(screen.queryByText("Next steps")).not.toBeInTheDocument();
  });

  it("situe l'expérience par sa catégorie et son année", () => {
    render(<ExperimentModal experiment={makeExperiment()} onClose={vi.fn()} />);
    expect(screen.getByText(/Simulation/)).toBeInTheDocument();
    expect(screen.getByText(/2025/)).toBeInTheDocument();
  });

  it("liste les technologies essayées", () => {
    render(<ExperimentModal experiment={makeExperiment()} onClose={vi.fn()} />);
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Canvas")).toBeInTheDocument();
  });

  it("n'affiche aucune puce de technologie quand la liste est vide", () => {
    render(<ExperimentModal experiment={makeExperiment({ tech: [] })} onClose={vi.fn()} />);
    expect(screen.queryByRole("list", { name: /technologies/i })).not.toBeInTheDocument();
  });

  it("rend tous les liens de l'expérience", () => {
    render(
      <ExperimentModal
        experiment={makeExperiment({
          links: [
            { label: "Demo", href: "https://example.com/demo" },
            { label: "Code", href: "https://example.com/repo" },
          ],
        })}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole("link", { name: "Demo" })).toHaveAttribute(
      "href",
      "https://example.com/demo"
    );
    expect(screen.getByRole("link", { name: "Code" })).toHaveAttribute(
      "href",
      "https://example.com/repo"
    );
  });

  // « Prototype » n'existe pas dans les statuts de projet : la pastille doit
  // tirer sa couleur de la table des expériences, pas retomber sur le neutre.
  it("colore la pastille avec la couleur du statut d'expérience", () => {
    render(<ExperimentModal experiment={makeExperiment({ status: "Prototype" })} onClose={vi.fn()} />);
    expect(screen.getByText("Prototype")).toHaveStyle({ color: "var(--color-status-violet)" });
  });

  it("n'affiche pas de pastille quand le statut est vide", () => {
    render(<ExperimentModal experiment={makeExperiment({ status: "" })} onClose={vi.fn()} />);
    expect(screen.queryByText("Prototype")).not.toBeInTheDocument();
  });

  it("se ferme avec le bouton de fermeture", async () => {
    const onClose = vi.fn();
    render(<ExperimentModal experiment={makeExperiment()} onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "Fermer" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("se ferme avec Échap", async () => {
    const onClose = vi.fn();
    render(<ExperimentModal experiment={makeExperiment()} onClose={onClose} />);

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });
});
