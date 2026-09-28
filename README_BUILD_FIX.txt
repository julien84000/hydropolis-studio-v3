Hydropolis Studio V11.51 - BUILD HOTFIX

Cause:
- GitHub package.json est encore en 11.42.0.
- Le build V11.51 rejoue donc les consolidateurs historiques.
- La configuration Resigres V11.51 est déjà en 2026-FR-v6.
- Les consolidateurs V11.46/V11.48/V11.49/V11.50 attendent au maximum la configuration v5 pendant leur étape historique.

Correction:
- apply-v11.51-consolidated.js présente temporairement la configuration v6 comme v5 pendant l'héritage V11.50,
  puis restaure automatiquement la v6 avant les contrôles et règles tarifaires V11.51.

Installation:
1. Remplacer uniquement apply-v11.51-consolidated.js à la racine du dépôt GitHub.
2. Garder Build Command: node apply-v11.51-consolidated.js
3. Garder Start Command: npm start
4. Deploy latest commit.

Validation:
- Syntaxe JS OK
- Simulation package.json 11.42 -> chaîne héritée V11.50 -> V11.51 OK
- Restauration config Resigres v6 OK
- Tests Contract pricing OK
- Tests statiques V11.51 OK
