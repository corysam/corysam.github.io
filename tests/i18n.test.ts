import { describe, expect, it } from "vitest";
import { dictionaries, hasLocale, LOCALES, localePath, statusLabel } from "@/lib/i18n";

/** Aplatit le dictionnaire en chemins « a.b.c » → valeur (les fonctions sont appelées). */
function flatten(value: unknown, prefix = ""): Record<string, string> {
  if (typeof value === "string") return { [prefix]: value };
  if (typeof value === "function") return { [prefix]: String(value("X", 1)) };
  return Object.entries(value as Record<string, unknown>).reduce(
    (acc, [k, v]) => ({ ...acc, ...flatten(v, prefix ? `${prefix}.${k}` : k) }),
    {} as Record<string, string>
  );
}

describe("dictionnaires", () => {
  const flat = Object.fromEntries(LOCALES.map((l) => [l, flatten(dictionaries[l])]));

  it("chaque langue a exactement les mêmes clés", () => {
    for (const l of LOCALES) expect(Object.keys(flat[l]).sort()).toEqual(Object.keys(flat.fr).sort());
  });

  it("aucun texte n'est vide", () => {
    for (const l of LOCALES) {
      const empty = Object.entries(flat[l]).filter(([, v]) => v.trim() === "");
      expect(empty).toEqual([]);
    }
  });

  it("traduit les statuts connus et laisse passer les statuts libres", () => {
    expect(statusLabel(dictionaries.fr, "Delivered")).toBe("Livré");
    expect(statusLabel(dictionaries.en, "Delivered")).toBe("Delivered");
    expect(statusLabel(dictionaries.fr, "Work in Progress")).toBe("Work in Progress");
  });
});

describe("helpers de langue", () => {
  it("hasLocale ne reconnaît que les langues du site", () => {
    expect(hasLocale("fr")).toBe(true);
    expect(hasLocale("en")).toBe(true);
    expect(hasLocale("de")).toBe(false);
  });

  it("localePath ancre sur la section, sauf l'accueil", () => {
    expect(localePath("en")).toBe("/en/");
    expect(localePath("en", "home")).toBe("/en/");
    expect(localePath("fr", "project")).toBe("/fr/#project");
  });
});
