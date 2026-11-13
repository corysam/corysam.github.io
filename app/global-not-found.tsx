import type { Metadata } from "next";
import { LANGUAGE_NAMES, LOCALES } from "@/lib/i18n";
import "./globals.css";

// Avec deux layouts racine (`/` et `/[lang]`), aucune mise en page commune ne
// peut habiller la 404 : cette page autonome la remplace (out/404.html, servie
// par GitHub Pages pour toute URL inconnue). La langue est inconnue ici : le
// message est bilingue.

export const metadata: Metadata = {
  title: "404",
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="fr">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-5 text-center">
          <h1 className="text-5xl text-ink">404</h1>
          <p className="text-muted">
            Page introuvable · <span lang="en">Page not found</span>
          </p>
          <ul className="flex gap-6">
            {LOCALES.map((l) => (
              <li key={l}>
                <a
                  href={`/${l}/`}
                  hrefLang={l}
                  lang={l}
                  className="rounded-full border border-line-soft px-5 py-2.5 text-sm text-muted transition-colors hover:border-white hover:text-white"
                >
                  {LANGUAGE_NAMES[l]}
                </a>
              </li>
            ))}
          </ul>
        </main>
      </body>
    </html>
  );
}
