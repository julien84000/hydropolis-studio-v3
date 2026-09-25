# Hydropolis Studio V11.47 — Resigres Assets

## Build Command Render

```bash
node apply-v11.47-consolidated.js
```

## Start Command

```bash
npm start
```

V11.47 conserve la tarification V11.46.1 et ajoute un resolver officiel Resigres :
- page produit exacte ;
- photo(s) officielles ;
- fiche technique PDF ;
- guide d'installation quand disponible ;
- fichier 3D (ZIP/DWG/STP/etc.) quand disponible.

Les anciens caches Resigres génériques sont ignorés au profit des assets officiels.
