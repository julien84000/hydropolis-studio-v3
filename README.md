# Hydropolis Studio V3 — Render

Version de test prête à être déployée comme **Web Service Node.js** sur Render.

## Render
- Language / Runtime : Node
- Build Command : `npm install`
- Start Command : `npm start`
- Health Check : `/api/health`
- Plan : Free

Le serveur écoute automatiquement `process.env.PORT` sur `0.0.0.0`, comme demandé par Render.

## Fonctionnement
Le dossier `public/` contient Hydropolis Studio.
Le serveur Express sert l'application et ajoute une API de test :
- `GET /api/health`
- `POST /api/manufacturer-images`

`/api/manufacturer-images` analyse une fiche produit officielle du fabricant et classe les images candidates en fonction de la référence et de la finition. Le catalogue PDF reste une solution de secours.

## Déploiement
1. Décompresser ce ZIP.
2. Mettre le contenu dans un dépôt GitHub.
3. Render > New > Web Service.
4. Connecter le dépôt.
5. Render détectera `render.yaml`, ou saisir :
   - Build Command : `npm install`
   - Start Command : `npm start`
   - Plan : Free
6. Créer le Web Service.
