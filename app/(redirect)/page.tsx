import { LANGUAGE_NAMES, LOCALES } from "@/lib/i18n";

// Sans JavaScript, la redirection n'a pas lieu : on propose les deux langues.
export default function RootRedirect() {
  return (
    <noscript>
      <ul style={{ display: "flex", gap: "1.5rem", justifyContent: "center", padding: "4rem 1rem", listStyle: "none" }}>
        {LOCALES.map((l) => (
          <li key={l}>
            <a href={`/${l}/`} hrefLang={l} lang={l} style={{ color: "inherit" }}>
              {LANGUAGE_NAMES[l]}
            </a>
          </li>
        ))}
      </ul>
    </noscript>
  );
}
