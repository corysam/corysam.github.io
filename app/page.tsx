import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Showcase } from "@/components/Showcase";
import { Stack } from "@/components/Stack";
import { Recommendations } from "@/components/Recommendations";
import { Footer } from "@/components/Footer";
import {
  getExperiments,
  getLab,
  getProfile,
  getProjects,
  getRecommendations,
  getStack,
} from "@/lib/content";

// Composant serveur : tout le contenu est lu dans content/ au moment du build
// et arrive pré-rendu dans le HTML statique.
export default function Home() {
  const profile = getProfile();
  const projects = getProjects();
  const lab = getLab(getExperiments());
  const stack = getStack();
  const recommendations = getRecommendations();

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Navbar />
      <main>
        <Hero profile={profile} />
        <About paragraphs={profile.about} expertises={profile.expertises} />
        <Showcase projects={projects} lab={lab} />
        <Stack rows={stack} />
        <Recommendations items={recommendations} />
      </main>
      <Footer name={profile.name} />
    </div>
  );
}
