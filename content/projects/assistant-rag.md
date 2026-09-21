---
name: Assistant RAG en production
status: In development
role: Conception & développement
order: 3
lab: true
description: Un assistant qui répond à partir d'un corpus documentaire, avec évaluations automatisées, suivi des coûts et observabilité.
mission: >-
  Construire de bout en bout un service LLM tel qu'on l'attend en production
  en 2026 : pas une démo, mais un système mesuré, tracé et déployé.
problem: >-
  La plupart des projets RAG s'arrêtent au prototype. Sans jeu d'évaluation,
  sans suivi du coût par requête et sans traces, impossible de savoir si le
  système s'améliore ou se dégrade quand on change un paramètre.
method: >-
  Boucle d'agent avec tool calling écrite à la main en TypeScript, recherche
  hybride (pgvector + BM25) avec reranking, jeu d'évaluation de 50 questions
  exécuté en CI, tracing de chaque appel, tableau de bord de coût en tokens,
  exposition d'outils via MCP. Déploiement Docker.
result: >-
  En cours. Objectif : un dépôt public avec les résultats d'évaluation, la
  courbe de coût et un retour d'expérience écrit sur les choix d'architecture.
links:
  - label: Dépôt GitHub
    href: "https://github.com/[user]/[repo]"
images:
  - /projects/placeholder-1.svg
  - /projects/placeholder-2.svg
---