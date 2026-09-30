# Hydropolis Studio — V11.55 ALPI

## Contenu
- `verify-release.js`
- `public/alpi_catalog_2025.json`
- `public/alpi-integration.js`

## Intégration ALPI
Source tarifaire : **ALPI — Tarif général au 1er mars 2025**.
Le catalogue intégré contient **3 041 références ALPI uniques à prix public HT**.
La remise achat Hydropolis est fixée à **55 %**.

Le module conserve :
- code ALPI ;
- code THEWA lorsqu'il est fourni ;
- série ALPI ;
- libellé ;
- prix public HT ;
- prix remisé 2025 ;
- finition ;
- catégorie ;
- page source du tarif.

## Corps d'encastrement
Les associations automatiques ne sont créées que lorsque le tarif 2025 relie explicitement une façade à une référence `INC...` **et** que cette référence encastrée dispose elle-même d'un prix exploitable dans le tarif.

48 références de façade sont ainsi reliées automatiquement à leur corps d'encastrement tarifé.
12 lignes du tarif mentionnent `INC2L869` mais aucune ligne tarifée correspondante n'a été trouvée dans le PDF fourni : elles restent volontairement sans ajout automatique afin de ne pas inventer un prix.

Le correctif V11.54.4 des corps d'encastrement est conservé. Lefroy Brooks reste exclu de cette logique car ses corps sont déjà intégrés par le catalogue.

## Visuels
Chaque produit ALPI pointe vers le site officiel `alpirubinetterie.com`.
Les visuels officiels sont recherchés **automatiquement** lorsque les cartes ALPI entrent dans la zone visible du catalogue ; aucun clic sur « Photo fabricant » n'est nécessaire.
Les pages de collection officielles sont utilisées lorsqu'elles sont identifiées (Allen, Vero, Nu, Portofino, Le Grand, London, Ginger, Gum, Blue, Steel’e, Una18), sinon la page générale produits ALPI sert de source.

## Installation
Copier les trois fichiers du ZIP dans le dépôt en conservant exactement les chemins :
- `verify-release.js` à la racine ;
- `public/alpi_catalog_2025.json` dans `public/` ;
- `public/alpi-integration.js` dans `public/`.

Puis commit/push sur `main`. Le build Render exécutera `verify-release.js`, qui injectera le module ALPI et contrôlera l'intégrité du catalogue avant démarrage.

## Contrôles intégrés
Le build vérifie notamment :
- 3 041 références ALPI ;
- remise = 55 % ;
- cohérence prix remisé = 45 % du prix public (tolérance d'arrondi) ;
- cohérence des corps d'encastrement liés ;
- syntaxe du module ALPI ;
- catalogues TDA et Vismaravetro déjà présents ;
- packs d'assets existants.
