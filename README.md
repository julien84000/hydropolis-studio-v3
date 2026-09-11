# Hydropolis Studio V3.6

Correctif ciblé du build Render.

## Erreur observée
Le build V3.5 échouait avec :

`Failed to set up chrome-headless-shell ...`

Le problème venait du téléchargement de Chrome pendant `npm install`.

## Correction V3.6
La V3.6 ne télécharge plus Chrome au moment du build.

Elle utilise :
- `puppeteer-core`
- `@sparticuz/chromium`

Chromium est fourni sous forme de dépendance npm et son chemin est transmis explicitement à Puppeteer au démarrage.

Le build Render redevient simplement :

`npm install`

## Test après déploiement
1. Attendre que Render affiche `Deploy succeeded`.
2. Recharger Hydropolis Studio avec un rechargement forcé.
3. Rechercher `RE001.BB`.
4. Cliquer `Trouver la photo fabricant`.
5. Vérifier que le serveur ouvre la fiche Amphora, sélectionne `BB Brushed Black PVD`, puis récupère le visuel correspondant.
6. Ajouter au projet et vérifier `Aperçu PDF`.

## PDF client
Toujours en A4 paysage :
- suppression des grandes marges blanches inutiles ;
- produit visible en entier ;
- aucune déformation ;
- `object-fit: contain`.
