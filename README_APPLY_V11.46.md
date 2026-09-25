# Appliquer Hydropolis Studio V11.46

1. Uploader tous les fichiers de ce ZIP à la racine du dépôt GitHub en conservant les dossiers `public/` et `tests/`.
2. Dans Render, Build Command : `node apply-v11.46-consolidated.js`
3. Start Command : `npm start`
4. Déployer le dernier commit.

V11.46 appelle automatiquement le consolidateur V11.45 si nécessaire puis remplace les assets V11.45 par les assets V11.46.
