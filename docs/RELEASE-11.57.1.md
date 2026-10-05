# Hydropolis Studio 11.57.1 — présentation des devis

Base : main `a9571a48c9c606bb5d3304ad460989f2a9cb59b3` (11.57.0).

## Correction permanente

- Titres des pièces et des espaces alignés à gauche dans le devis et son éditeur ; montants toujours alignés à droite.
- Une seule occurrence du nom de pièce dans le devis, même sur plusieurs pages. Les espaces restent indiqués en début de page de continuation.
- Pièces de même désignation regroupées pour la présentation, en normalisant les espaces et la casse ; leurs identifiants et les cibles d'édition restent distincts.
- Accessoires WC (porte-papier, plaque de commande, bâti-support, douchette hygiénique) classés avec le WC, y compris les lignes libres reconnues.
- Accessoires liés à un article classés dans son espace ; protection contre les liens cycliques.
- Un article générique peut hériter du seul espace identifié dans sa pièce. En présence de plusieurs espaces et sans indice suffisant, sa ligne reste conservée sans créer de rubrique « Autres éléments ».
- Aucun changement des catalogues, tarifs, références, médias, règles de calcul ou synchronisation des quantités. Excel conserve `quoteRows()` et les identifiants sources nécessaires aux coûts/marges. Moodboard hors périmètre.

## Validation

- `npm run check` : 21 fichiers JavaScript.
- `npm test` : 31 tests.
- `npm run build` : syntaxe et 31 tests.
- `npm run test:browser` : 28 contrôles catalogue + 25 contrôles régression ; aucun échec ni erreur JavaScript.
- Volumes catalogues inchangés : Amphora 171 ; Coalbrook 1483 ; ALPI 3041 ; Catalano 1430 ; Nicolazzi 36303 ; Hotbath 2554 ; Lefroy Brooks 3397 ; Gessi 16211 ; Ritmonio 16082 ; Recor 192 distinctes ; Resigres 38 ; Fioranese 1135 ; Vismaravetro 15 ; TDA 20 ; Sira 5 familles ; Zucchetti 12053.
- Cas de devis sur deux pages : titres à gauche, deux pièces affichées une seule fois chacune, WC et corps d'encastrement correctement rattachés, 14 lignes conservées, total HT 1510 €, sources non modifiées, cibles d'édition préservées.
- Un échec initial a révélé un titre contenant des espaces multiples après regroupement ; la source a été corrigée, sans affaiblir l'assertion.
- Aperçu navigateur contrôlé visuellement. Le projet client réel de la capture n'est pas accessible dans la base locale de test.

## Déploiement

État à la rédaction : validation locale ; CI, fusion et contrôle Render consignés dans la PR après publication. Ne pas assimiler la validation locale à un contrôle visuel du projet client en production.
