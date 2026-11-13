import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { I18nProvider } from "@/components/I18nProvider";
import type { Locale } from "@/lib/i18n";

// jsdom n'implémente pas la navigation : on l'annule après les gestionnaires
// du composant, qui ont alors déjà fait leur travail.
const blockNavigation = (e: Event) => e.preventDefault();
beforeEach(() => document.addEventListener("click", blockNavigation));
afterEach(() => {
  document.removeEventListener("click", blockNavigation);
  localStorage.clear();
});

const renderSwitcher = (locale: Locale = "fr", section?: Parameters<typeof LanguageSwitcher>[0]["section"]) =>
  render(
    <I18nProvider locale={locale}>
      <LanguageSwitcher section={section} />
    </I18nProvider>
  );

describe("LanguageSwitcher", () => {
  it("est fermé par défaut et s'ouvre au clic sur le globe", async () => {
    renderSwitcher();
    const button = screen.getByRole("button", { name: "Langue" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "English" })).not.toBeInTheDocument();

    await userEvent.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Français" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "English" })).toBeInTheDocument();
  });

  it("traduit son nom accessible", () => {
    renderSwitcher("en");
    expect(screen.getByRole("button", { name: "Language" })).toBeInTheDocument();
  });

  it("marque la langue courante", async () => {
    renderSwitcher("en");
    await userEvent.click(screen.getByRole("button", { name: "Language" }));
    expect(screen.getByRole("link", { name: "English" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Français" })).not.toHaveAttribute("aria-current");
  });

  it("pointe vers la page de l'autre langue, ancrée sur la section courante", async () => {
    renderSwitcher("fr", "stack");
    await userEvent.click(screen.getByRole("button", { name: "Langue" }));
    expect(screen.getByRole("link", { name: "English" })).toHaveAttribute("href", "/en/#stack");
  });

  it("ne garde pas d'ancre pour l'accueil", async () => {
    renderSwitcher("fr", "home");
    await userEvent.click(screen.getByRole("button", { name: "Langue" }));
    expect(screen.getByRole("link", { name: "English" })).toHaveAttribute("href", "/en/");
  });

  it("mémorise la langue choisie pour la redirection de la racine", async () => {
    renderSwitcher("fr");
    await userEvent.click(screen.getByRole("button", { name: "Langue" }));
    await userEvent.click(screen.getByRole("link", { name: "English" }));
    expect(localStorage.getItem("lang")).toBe("en");
  });

  it("se ferme à l'Échap et au clic extérieur", async () => {
    renderSwitcher();
    const button = screen.getByRole("button", { name: "Langue" });

    await userEvent.click(button);
    await userEvent.keyboard("{Escape}");
    expect(button).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(button);
    await userEvent.click(document.body);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("choisir la langue courante referme simplement la liste", async () => {
    renderSwitcher("fr");
    const button = screen.getByRole("button", { name: "Langue" });
    await userEvent.click(button);
    await userEvent.click(screen.getByRole("link", { name: "Français" }));
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(localStorage.getItem("lang")).toBeNull();
  });
});
