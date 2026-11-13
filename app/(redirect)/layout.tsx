import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALES, LOCALE_STORAGE_KEY } from "@/lib/i18n";

// Second layout racine, réservé à `/` : une page vide qui envoie le visiteur
// vers /fr/ ou /en/. Le proxy et les redirects de Next n'existent pas en export
// statique, la décision se prend donc dans le navigateur, avant tout rendu.

export const metadata: Metadata = {
  // `/` n'a pas de contenu propre : les moteurs indexent /fr/ et /en/.
  robots: { index: false, follow: true },
  // Voir NO_FAVICON dans app/[lang]/layout.tsx.
  icons: { icon: "data:," },
  alternates: {
    languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}/`])),
  },
};

/**
 * Langue mémorisée par le bouton de langue, sinon français si le navigateur
 * est en français, sinon anglais. Le hash éventuel (/#stack) est conservé.
 */
const redirectScript = `(function () {
  var locales = ${JSON.stringify(LOCALES)};
  var l = null;
  try { l = localStorage.getItem(${JSON.stringify(LOCALE_STORAGE_KEY)}); } catch (e) {}
  if (locales.indexOf(l) === -1) {
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || "";
    l = /^fr\\b/i.test(nav) ? "fr" : "en";
  }
  location.replace("/" + l + "/" + location.hash);
})();`;

export default function RedirectLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={DEFAULT_LOCALE}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: redirectScript }} />
      </head>
      <body style={{ margin: 0, minHeight: "100vh", background: "#0a0e24", color: "#e8eaf2" }}>{children}</body>
    </html>
  );
}
