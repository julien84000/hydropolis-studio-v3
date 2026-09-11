# Hydropolis Studio V3.2 — Mise à jour Render

## Ce que corrige V3.2
- Le bouton **Trouver la photo fabricant** est maintenant réellement présent dans le catalogue.
- À l'ajout d'un produit, l'application cherche automatiquement sa photo officielle.
- Pour Amphora, le serveur privilégie le lien **Download area > IMAGE** de la fiche produit.
- Le serveur tente ensuite, de façon prudente, de détecter un fichier officiel spécifique à la finition BS / BB / BC.
- Si la photo officielle trouvée ne permet pas de certifier la finition, l'application l'indique clairement : **finition non garantie**.
- Aucune photo de catalogue générique n'est utilisée silencieusement à la place d'une finition exacte.
- Les photos sont servies via Render afin d'éviter les blocages CORS/hotlink.
- Cache navigateur des photos déjà validées.
- A4 paysage et redimensionnement automatique conservés.

## Test recommandé
1. Rechercher `RE001.BC`.
2. Cliquer `Trouver la photo fabricant`.
3. Vérifier la mention sous la photo :
   - `✓ Photo fabricant · Cuivre brossé PVD` si une ressource officielle spécifique est trouvée ;
   - ou `Photo fabricant · finition non garantie` si Amphora ne publie qu'un visuel générique du produit.

Le site officiel Amphora publie bien la fiche RE001 avec les trois finitions BS, BB et BC et un lien de téléchargement IMAGE. La V3.2 exploite cette structure plutôt qu'une recherche générique d'images.
