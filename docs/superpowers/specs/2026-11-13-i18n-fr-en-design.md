# Internationalisation FR / EN — design

## Intention

Rendre le portfolio lisible par des recruteurs et clients non francophones :
le site entier (interface **et** contenu) existe en français et en anglais, et
le visiteur change de langue avec un bouton « language » (icône globe) placé à
droite de la navbar.

## Décisions (prises avec Clément)

- **Périmètre** : interface + contenu (profil, projets, expériences, stack,
  recommandations). Le contenu existant est traduit, et le CMS édite les deux langues.
- **URLs** : `/fr/` et `/en/`, deux pages statiques. Un lien en anglais est
  partageable, et Google indexe les deux versions (hreflang).
- **Racine `/`** : redirection vers la langue mémorisée par le bouton, sinon vers
  celle du navigateur (FR si `navigator.languages[0]` commence par `fr`, sinon EN).

## Approches considérées

| Approche | Pour | Contre |
|---|---|---|
| **`app/[lang]` + `generateStaticParams`** (retenue) | Recommandée par la doc Next ; vraie page par langue ; aucune dépendance | La racine doit rediriger côté client (pas de proxy en export statique) |
| Bascule côté client, URL unique | Le plus simple | Pas de lien partageable en anglais ; Google ne voit que le FR |
| `next-intl` | Outillage complet | Surdimensionné pour une seule page en export statique |

## Conception

- **Routage** : `app/[lang]/layout.tsx` + `page.tsx` (layout racine, `dynamicParams = false`),
  et `app/(redirect)/` (second layout racine) pour `/`, avec un script inline et des
  liens `<noscript>`. Comme il y a plusieurs layouts racine, la 404 est une page
  autonome, `app/global-not-found.tsx` (`experimental.globalNotFound`).
  `trailingSlash: true` produit `out/fr/index.html` et `out/en/index.html`.
- **Interface** : dictionnaire typé dans `lib/i18n.ts` et contexte client
  `components/I18nProvider.tsx`. Le contexte vaut FR par défaut, pour que les
  composants rendus hors provider (tests) fonctionnent. Les statuts gardent leurs
  clés anglaises (elles pilotent les couleurs) et sont traduits à l'affichage.
- **Bouton de langue** : `components/LanguageSwitcher.tsx`, qui suit le pattern
  *disclosure* (bouton `aria-expanded` + liste de vrais liens). La langue courante
  est cochée. Chaque lien est ancré sur la section en cours (`/en/#stack`) et
  mémorise le choix dans `localStorage.lang`.
- **Contenu** : structure Sveltia `multiple_files`, avec
  `omit_default_locale_from_file_path`. Le français garde ses fichiers actuels,
  l'anglais est un jumeau `*.en.*`. Le fichier FR est la source de tous les champs
  structurels. Les textes viennent de la traduction, avec repli sur le FR. La stack
  est fusionnée par rang, les recommandations par `id`.

## Non-objectifs

- Pas de troisième langue prévue, mais `LOCALES` la rendrait facile à ajouter.
- Pas de traduction de `lab.json` (des identifiants uniquement).
- Une traduction manquante ne bloque jamais le déploiement : c'est un avertissement
  de `check:content`, pas un test.

## Choix laissés au builder (faits pendant l'implémentation)

- Libellés : « Projets / Projects », « Recommandations / Recommendations »
  (au lieu de « Project » / « Recommandation » au singulier).
- Entre 768 et 1024 px, l'écart entre les onglets passe à 24 px, pour laisser la
  place au globe.
- Les `learnings` encore à « [À remplir] » en français ne sont pas traduits :
  ils retomberont sur le texte français une fois celui-ci rédigé.
