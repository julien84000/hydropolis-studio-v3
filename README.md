# Hydropolis Studio V3.5

Correctif ciblé du problème vu dans les logs Render :

`Dynamic finish lookup failed: Could not find Chrome`

## Correction
Render installe maintenant explicitement Chrome pendant le build :

`npm install && npx puppeteer browsers install chrome`

Le cache Puppeteer est placé dans le projet pour que le navigateur installé au build soit retrouvé au runtime.

## Test après déploiement
1. Attendre la fin complète du build Render.
2. Recharger Hydropolis Studio.
3. Rechercher `RE001.BB`.
4. Cliquer `Trouver la photo fabricant`.
5. La fiche Amphora doit être ouverte côté serveur et la finition `BB Brushed Black PVD` sélectionnée avant récupération de l'image.
6. Vérifier ensuite l'Aperçu PDF.

La logique PDF A4 paysage avec image entière et recadrage des marges blanches reste inchangée.
