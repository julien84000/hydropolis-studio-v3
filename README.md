# Hydropolis Studio V3.1 — Render

Mise à jour de la V3 déjà déployée.

## Nouveautés
- recherche automatique d'image sur la fiche officielle fabricant ;
- prise en compte de la référence et de la finition `BS / BB / BC` dans le classement des images ;
- récupération des images via le serveur Render pour éviter les blocages de hotlink/CORS ;
- cache local des images déjà trouvées ;
- recherche automatique au moment où un produit est ajouté à une pièce ;
- bouton **Trouver / Actualiser la photo fabricant** ;
- le catalogue PDF reste uniquement une solution de secours ;
- dossier client A4 paysage conservé.

## Mise à jour sur GitHub
Remplacer les fichiers actuels du dépôt par ceux contenus dans ce ZIP.
Render redéploiera automatiquement après le commit.

Fichiers modifiés principalement :
- `server.js`
- `public/app.js`
- `public/index.html`
- `public/styles.css`
