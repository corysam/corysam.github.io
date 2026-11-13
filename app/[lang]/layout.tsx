import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Tomorrow, Red_Hat_Display } from "next/font/google";
import { dictionaries, hasLocale, LOCALES, localePath } from "@/lib/i18n";
import { getProfile } from "@/lib/content";
import "../globals.css";

const tomorrow = Tomorrow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-tomorrow",
});

const redHatDisplay = Red_Hat_Display({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-red-hat",
});

// Export statique : une page par langue, rien d'autre (une langue inconnue est une 404).
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/**
 * Le site n'a pas de favicon : sans icône déclarée, le navigateur réclame
 * /favicon.ico, qui tombe dans la route /[lang] (lang = "favicon.ico"). En dev,
 * `output: "export"` en fait une erreur « missing param » à chaque chargement.
 * Une icône vide coupe cette requête — même rendu qu'avant (icône par défaut).
 * À remplacer par un vrai fichier (app/icon.svg) le jour où il y en a un.
 */
const NO_FAVICON: Metadata["icons"] = { icon: "data:," };

// Typage manuel plutôt que LayoutProps : `npm run typecheck` tourne en CI avant
// le build, donc avant que Next ne génère ses types de routes.
type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = dictionaries[lang].meta;
  const { name } = getProfile(undefined, lang);

  return {
    metadataBase: new URL("https://corysam.github.io"),
    title: `${name} — ${t.role}`,
    description: t.description(name),
    icons: NO_FAVICON,
    alternates: {
      canonical: localePath(lang),
      languages: Object.fromEntries(LOCALES.map((l) => [l, localePath(l)])),
    },
  };
}

export default async function RootLayout({ children, params }: Params & { children: React.ReactNode }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html lang={lang} className={`${tomorrow.variable} ${redHatDisplay.variable}`}>
      <body>{children}</body>
    </html>
  );
}
