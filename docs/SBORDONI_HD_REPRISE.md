# Reprise prioritaire — vraies photos HD Sbordoni

Contrôle du 29 octobre 2026, à la demande explicite de Julien : les photos HD Sbordoni ne sont pas livrées de manière satisfaisante.

## État réellement observé

- main : b42856e1b3f776556b88e58b35ceac6cda3f81cc (« Release V11.64.13 — Sbordoni finalisé »).
- Production /api/version : 11.64.13 ; /api/health : ok=true, database=postgresql, le 29/10/2026 à 14:03:55 UTC.
- public/sbordoni/compositions/hd-manifest.json décrit 99 compositions rendues à partir de placements du PDF.
- 93 sur 99 ont leur plus grand côté inférieur à 600 pixels. Grands côtés : 186 à 656 pixels.
- Vérification directe des JPEG en production : 5022-default.jpg = 190 × 189 pixels ; 5700-G571.jpg = 440 × 422 pixels.
- Le test tests/sbordoni-hd-assets.test.js accepte notamment un seuil de 110 × 70 pixels : il contrôle intégrité/provenance, mais ne prouve pas la haute définition.
- Le nom hd-manifest et le titre de release ne doivent donc pas être présentés comme preuve de photos HD finalisées.

## Travail à faire

1. Rechercher les photographies officielles Sbordoni à leur résolution native, modèle et composition exacts : vasque seule, piétement, support et WC. Inspecter d'abord les sources et scripts déjà présents.
2. Pour les images présentes dans le PDF, examiner la résolution de l'image embarquée avant de rendre un petit placement ; conserver orientation, cadrage et correspondance exacte.
3. Ne pas agrandir artificiellement une petite image pour la qualifier de HD. En l'absence de source suffisamment définie, consigner la limite par référence.
4. Remplacer les fichiers effectivement consommés par les configurateurs, le projet et le dossier photo ; vérifier le téléchargement de ces fichiers en production et le cache.
5. Ajouter un audit de résolution natale et une vérification visuelle, avec exceptions explicites lorsque le fabricant ne fournit pas de HD. Conserver les 98 documents techniques et tous les configurateurs.
6. Commits fréquents, PR, CI avant fusion, puis contrôle de la version et des fichiers réels en production.

## Continuité Hidrobox

Ne pas repartir de l'ancien état 11.64.9 : des développements concurrents ont ajouté Space (11.64.10), Beta Evoque (11.64.11), Beta Essential (11.64.12). Lire docs/REPRISE_CHATGPT.md et le dernier main avant toute modification. Préserver Program/Neo Plus de la PR #54, les dimensions tarifaires exactes, +4 % une fois et remise achat de 50 %. Poursuivre les collections restantes à partir du tarif PDF, jamais de dimensions supposées. Documents techniques demandés ; pas d'intégration BIM complète.

## Prompt de reprise

Reprends julien84000/hydropolis-studio-v3. Lis docs/SBORDONI_HD_REPRISE.md et docs/REPRISE_CHATGPT.md ; contrôle main, PR, CI et Render. La production observée était 11.64.13, mais les compositions Sbordoni étaient encore de faible résolution (93/99 sous 600 px). Corrige réellement les photos avec des sources officielles de haute résolution, en conservant la bonne composition et sans suréchantillonnage présenté comme HD. Vérifie les images effectivement servies et leur rendu dans les configurateurs et le dossier photo. Préserve les fiches techniques, les projets, toutes les autres marques et les correctifs Hidrobox intervenus depuis la PR #54. Sauvegarde fréquemment sur GitHub, teste, ouvre une PR, fusionne si CI verte et vérifie le déploiement.
