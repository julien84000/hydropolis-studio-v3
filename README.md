# Hydropolis Studio V11.4

## Correctif Hotbath basé sur les logs Render

Les logs V11.3 montraient une séquence claire :
- Hydropolis trouvait une URL dans la page Hotbath ;
- la marquait à tort comme `exact:true` avec `source:"official-page"` ;
- l'URL réelle répondait ensuite **404** lors de l'embed et du recadrage ;
- comme l'image était déjà considérée « exacte », le fallback Sawiday n'était jamais exécuté.

### V11.4

1. **Une image Hotbath n'est plus acceptée sans test HTTP réel.**
   Les meilleures candidates sont vérifiées avant d'être envoyées au navigateur.

2. **Les images génériques `official-page` ne peuvent plus certifier une finition Hotbath.**
   Une photo officielle exacte doit provenir du parseur Hotbath dédié, porter le code
   finition demandé et être réellement accessible.

3. **Sawiday devient réellement le fallback automatique de niveau 2.**
   La recherche utilise d'abord Bing RSS (plus robuste côté Render), puis l'HTML en secours.
   La page Sawiday doit contenir exactement le numéro fournisseur Hotbath.

4. **Le bouton de recherche web utilise lui aussi Sawiday en priorité.**
   La recherche d'images générique n'intervient qu'en dernier recours.

5. **Aucune URL Hotbath 404 n'est conservée dans le cache navigateur.**
   Si l'embed échoue, la vignette reste proprement sans image plutôt que d'afficher
   l'icône d'image cassée.

## Dessins techniques Hotbath

La logique V11.3 est conservée :
- `Drawing` = dessin technique JPG officiel ;
- `Technical info` = fiche technique JPG/PDF ;
- `Instructions` = notice PDF ;
- `CAD` = fichiers DAO.

Le Drawing JPG est automatiquement proposé/inclus lorsqu'il est disponible.
