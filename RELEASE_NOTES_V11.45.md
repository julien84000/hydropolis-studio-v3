# Release notes — Hydropolis Studio V11.45

## Consolidation

- V11.42 : quantités intégrées nativement.
- V11.43 : devis modifiable, une ligne par article.
- V11.44 : blocs de présentation client déplaçables/redimensionnables et géométrie corrigée.
- suppression du patch V11.42 au `npm start` ; démarrage direct par `node server.js`.
- bootstrap différé jusqu'au chargement des extensions V11.45 afin que les surcharges soient actives avant l'ouverture du workspace.

## Fioranese 2025

- 1 135 entrées au catalogue.
- 1 132 lignes tarifaires structurées vérifiées ; 3 familles conservées en accès PDF sans prix automatique en raison d'une extraction tarifaire ambiguë.
- support distinct des unités `m²`, `pièce` et `composition`.
- calcul automatique du nombre de boîtes et des m² commandés pour toute ligne au m² disposant d'un `sqmPerBox`.
- quantité saisie par l'utilisateur conservée séparément des m² réellement facturés/commandés.
- réaffichage dans le projet et le devis : m² demandé, nombre de boîtes et m² commandés.
- liens officiels Fioranese utilisés comme source de visuels fabricant.

## Resigres 2026

- 38 points d'entrée de configuration couvrant le tarif FR 2026.
- configurateur intégré : modèle, finition/matière, coloris, dimensions et options selon la famille.
- règle globale conservée : taille intermédiaire → tarif de la taille supérieure de la colonne SUR MESURE lorsque la page le prévoit.
- tolérance dimensionnelle documentée : ±0,7 %.
- suppléments Vento clairement vérifiés automatisés ; matrices de prix ambiguës non auto-interprétées.
- page source enregistrée sur l'article configuré.
- liens officiels Resigres utilisés pour l'enrichissement des visuels.

## Robustesse

- conservation des champs modifiés/configurés lors de la réharmonisation d'un projet sauvegardé : désignation, finition, quantité, m² demandés, conditionnement, configuration Resigres, prix et éléments visuels/documentaires.
- vérification statique des manifests, du service worker, de l'allowlist fabricant et du démarrage sans patch.
- tests unitaires de la logique de conditionnement Fioranese et des suppléments Resigres.
