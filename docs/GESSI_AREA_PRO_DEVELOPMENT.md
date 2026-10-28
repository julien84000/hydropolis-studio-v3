# Gessi Area Pro — reprise V11.64.0

## Sauvegarde 1 — sources officielles (28 octobre 2026)
Base : main acd5bf3 (PR #42), application 11.63.8. PR #41 Gessi visuel et #42 classement multi-univers déjà fusionnées ; CI de #42 réussie. Render /api/version et /api/health ont confirmé 11.63.8 et PostgreSQL. PR #43 Bette ouverte : ne pas écraser son travail.

Branche : feat/gessi-official-resources-1164.

Terminé et sauvegardé :
- Lecture du vrai bundle Area Pro public et identification de ses endpoints publics.
- Capture du menu FR : 9 univers, 79 entrées univers/collection, images officielles et sous-séries (certains noms sont partagés entre univers).
- Import reproductible scripts/import-gessi-menu.js vers public/gessi-area-pro-menu.json, sans prix ni références inventés.
- Captures officielles de l'article 66134 et de ses ressources : finitions, images exactes, dimensions, lien BIMObject provenant de Gessi.
- Aucun fichier du catalogue tarifaire ni donnée client modifié. Pas encore de changement de l'interface ou de déploiement dans ce checkpoint.

À faire : intégrer les grandes images officielles de collections ; permettre la consultation des collections non tarifées ; utiliser les listes publiques Gessi pour les modèles et sous-séries ; charger les photos par finition et documents exacts à la demande ; préserver strictement les 16 211 lignes tarifaires et corps techniques ; rendre les finitions visuelles ; tester desktop/mobile et les autres marques.

## Prompt de reprise
Reprends Hydropolis Studio sur la branche feat/gessi-official-resources-1164. Lis docs/GESSI_AREA_PRO_DEVELOPMENT.md puis docs/REPRISE_CHATGPT.md, les dernières PR et main. Préserve les PR #41/#42 Gessi et la PR Bette #43 ou ses successeurs. Les sources officielles du menu Gessi (9 univers, 79 entrées) sont sauvegardées, mais leur nouvelle intégration UI n'est pas encore réalisée. Continue réellement le configurateur visuel, références/finition/documents exacts et prix issus uniquement du tarif existant. Fais des checkpoints GitHub fréquents, ajoute les tests et vérifie CI, fusion puis Render avant d'annoncer un déploiement. Actualise ce document après chaque étape.
