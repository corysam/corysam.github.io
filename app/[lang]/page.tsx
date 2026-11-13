import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Showcase } from "@/components/Showcase";
import { Stack } from "@/components/Stack";
import { Recommendations } from "@/components/Recommendations";
import { Footer } from "@/components/Footer";
import { I18nProvider } from "@/components/I18nProvider";
import { hasLocale } from "@/lib/i18n";
import {
  getExperiments,
  getLab,
  getProfile,
  getProjects,
  getRecommendations,
  getStack,
} from "@/lib/content";

// Composant serveur : tout le contenu est lu dans content/ au moment du build,
// une fois par langue, et arrive pré-rendu dans le HTML statique de /fr/ et /en/.
export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const profile = getProfile(undefined, lang);
  const projects = getProjects(undefined, lang);
  const lab = getLab(getExperiments(undefined, lang));
  const stack = getStack(undefined, lang);
  const recommendations = getRecommendations(undefined, lang);

  return (
    <I18nProvider locale={lang}>
      <div className="min-h-screen w-full overflow-x-hidden">
        <Navbar />
        <main>
          <Hero profile={profile} />
          <About paragraphs={profile.about} expertises={profile.expertises} photo={profile.photo} />
          <Showcase projects={projects} lab={lab} />
          <Stack rows={stack} />
          <Recommendations items={recommendations} />
        </main>
        <Footer name={profile.name} locale={lang} />
      </div>
    </I18nProvider>
  );
}
