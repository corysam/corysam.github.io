import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Showcase } from "@/components/Showcase";
import { Stack } from "@/components/Stack";
import { Recommendations } from "@/components/Recommendations";
import { Navbar } from "@/components/Navbar";
import { SECTIONS } from "@/lib/sections";
import { dictionaries } from "@/lib/i18n";
import { I18nProvider } from "@/components/I18nProvider";
import { gridProject, lab, profile, recommendations, stack } from "./fixtures";

/** Reproduit la composition de app/page.tsx, sans le chargement serveur. */
const renderPage = () =>
  render(
    <>
      <Navbar />
      <Hero profile={profile} />
      <About paragraphs={profile.about} expertises={profile.expertises} />
      <Showcase projects={[gridProject]} lab={lab} />
      <Stack rows={stack} />
      <Recommendations items={recommendations} />
    </>
  );

describe("Navigation et sections (régression audit D4)", () => {
  // Le typage SectionId empêche une divergence à la compilation ;
  // ce test la verrouille aussi à l'exécution.
  it("chaque entrée de SECTIONS correspond à une section réellement rendue", () => {
    renderPage();

    const missing = SECTIONS.filter((s) => document.getElementById(s.id) === null).map((s) => s.id);
    expect(missing).toEqual([]);
  });

  it("la navbar affiche un onglet par section", () => {
    render(<Navbar />);
    for (const s of SECTIONS) {
      expect(screen.getAllByRole("button", { name: dictionaries.fr.nav[s.id] }).length).toBeGreaterThan(0);
    }
  });

  it("la navbar suit la langue du provider", () => {
    render(
      <I18nProvider locale="en">
        <Navbar />
      </I18nProvider>
    );
    for (const s of SECTIONS) {
      expect(screen.getAllByRole("button", { name: dictionaries.en.nav[s.id] }).length).toBeGreaterThan(0);
    }
    expect(screen.queryByRole("button", { name: "À propos" })).not.toBeInTheDocument();
  });

  it("la navbar contient le bouton de langue", () => {
    render(<Navbar />);
    expect(screen.getByRole("button", { name: "Langue" })).toBeInTheDocument();
  });

  // Régression : `relative` (ancre de la liste) et `absolute` (placement dans la
  // navbar) sur le même élément — `.relative` l'emportait dans le CSS généré et
  // le globe retombait dans le flux, collé en haut après le dernier onglet.
  it("le globe est placé par un conteneur absolu, distinct de l'ancre de la liste", () => {
    render(<Navbar />);
    const anchor = screen.getByRole("button", { name: "Langue" }).parentElement!;
    expect(anchor).toHaveClass("relative");
    expect(anchor).not.toHaveClass("absolute");
    expect(anchor.parentElement).toHaveClass("absolute", "top-1/2", "-translate-y-1/2");
  });

  it("cliquer un onglet fait défiler vers la section correspondante", async () => {
    renderPage();
    const target = document.getElementById("stack")!;
    const scrollIntoView = vi.spyOn(target, "scrollIntoView");

    await userEvent.click(screen.getAllByRole("button", { name: "Stack" })[0]);

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
  });
});

describe("Sections — contenu", () => {
  it("About rend tous les paragraphes et expertises", () => {
    render(<About paragraphs={profile.about} expertises={profile.expertises} />);
    for (const p of profile.about) expect(screen.getByText(p)).toBeInTheDocument();
    for (const e of profile.expertises) expect(screen.getByText(e)).toBeInTheDocument();
  });

  it("About affiche la photo quand elle est renseignée", () => {
    render(<About paragraphs={profile.about} expertises={profile.expertises} photo="/photo.jpg" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "/photo.jpg");
  });

  it("About garde le cadre vide sans photo (champ absent ou vidé dans le CMS)", () => {
    const { rerender } = render(<About paragraphs={profile.about} expertises={profile.expertises} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    rerender(<About paragraphs={profile.about} expertises={profile.expertises} photo="" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  // Régression audit M3 : la section affichait des ronds vides au lieu du vrai stack.
  it("Stack rend les technologies du contenu, pas des ronds vides", () => {
    render(<Stack rows={stack} />);
    expect(screen.getByText("Back End")).toBeInTheDocument();
    expect(screen.getByText("Node.js")).toBeInTheDocument();
    expect(screen.getByText("Express")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("Recommendations rend chaque témoignage", () => {
    render(<Recommendations items={recommendations} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Très bon travail.")).toBeInTheDocument();
  });

  it("Recommendations affiche un badge par plateforme d'origine", () => {
    render(<Recommendations items={recommendations} />);
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
    expect(screen.getByText("Malt")).toBeInTheDocument();
  });
});
