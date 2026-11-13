import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Hero } from "@/components/Hero";
import { profile } from "./fixtures";

const CONFIRMATION = /Copié dans le presse-papier/;

/** Remplace navigator.clipboard (absent ou en lecture seule sous jsdom). */
function setClipboard(value: { writeText: () => Promise<void> } | undefined) {
  Object.defineProperty(navigator, "clipboard", {
    value,
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  setClipboard(undefined);
});

describe("Hero — copie dans le presse-papier (régression audit B1)", () => {
  it("confirme la copie quand l'API clipboard réussit", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    render(<Hero profile={profile} />);

    await userEvent.click(screen.getByRole("button", { name: "E-mail" }));

    expect(writeText).toHaveBeenCalledWith(profile.email);
    expect(await screen.findByText(CONFIRMATION)).toBeInTheDocument();
  });

  // Le bug d'origine : sans API clipboard, `await undefined` réussissait et
  // l'UI annonçait "Copié" alors que rien n'avait été copié.
  it("ne confirme RIEN quand il n'y a ni API clipboard ni fallback", async () => {
    setClipboard(undefined);
    document.execCommand = vi.fn(() => false);
    render(<Hero profile={profile} />);

    await userEvent.click(screen.getByRole("button", { name: "E-mail" }));

    await waitFor(() => expect(document.execCommand).toHaveBeenCalledWith("copy"));
    expect(screen.queryByText(CONFIRMATION)).not.toBeInTheDocument();
  });

  it("confirme via le fallback execCommand quand l'API clipboard échoue", async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error("refusé")) });
    document.execCommand = vi.fn(() => true);
    render(<Hero profile={profile} />);

    await userEvent.click(screen.getByRole("button", { name: "Téléphone" }));

    expect(await screen.findByText(CONFIRMATION)).toBeInTheDocument();
  });

  it("ne confirme pas non plus si l'API clipboard ET le fallback échouent", async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error("refusé")) });
    document.execCommand = vi.fn(() => false);
    render(<Hero profile={profile} />);

    await userEvent.click(screen.getByRole("button", { name: "E-mail" }));

    await waitFor(() => expect(document.execCommand).toHaveBeenCalled());
    expect(screen.queryByText(CONFIRMATION)).not.toBeInTheDocument();
  });
});

describe("Hero — contenu", () => {
  it("affiche le nom et la tagline du profil", () => {
    render(<Hero profile={profile} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(profile.name);
    expect(screen.getByText(profile.tagline)).toBeInTheDocument();
  });

  it("le lien LinkedIn s'ouvre dans un nouvel onglet en toute sécurité", () => {
    render(<Hero profile={profile} />);
    const link = screen.getByRole("link", { name: "LinkedIn" });
    expect(link).toHaveAttribute("href", profile.linkedin);
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  // Audit M5 : le bouton CV ne doit pas pointer vers "#".
  it("masque le bouton CV quand aucun CV n'est fourni", () => {
    render(<Hero profile={{ ...profile, resume: null }} />);
    expect(screen.queryByText("Télécharger le CV")).not.toBeInTheDocument();
  });

  it("affiche le bouton CV quand un CV est fourni", () => {
    render(<Hero profile={{ ...profile, resume: "/cv.pdf" }} />);
    expect(screen.getByRole("link", { name: /Télécharger le CV/ })).toHaveAttribute("href", "/cv.pdf");
  });
});
