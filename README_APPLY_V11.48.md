# Hydropolis Studio V11.48 — Resigres Configurator Matrix

## Render
Build Command:

    node apply-v11.48-consolidated.js

Start Command:

    npm start

## Changement principal
Le configurateur Resigres ne présente plus des listes globales indépendantes. Chaque étape dépend des choix précédents.

Exemple Nesta :
- dimension 80 × 180 cm → Acrylique uniquement → Blanc brillant ou Blanc mat ;
- dimension 80 × 170 cm → Solid Surface ou Laqué ;
- Solid Surface → S-Blanco uniquement ;
- Laqué → palette standard Resigres ou RAL/NCS sur mesure.

Les autres familles Resigres utilisent le même moteur dépendant. Lorsqu'une matrice n'est pas encore certifiée, Hydropolis n'injecte plus de choix globaux potentiellement faux : la configuration reste volontairement limitée et le prix peut être saisi depuis le tarif.
