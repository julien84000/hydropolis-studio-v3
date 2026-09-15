# Hydropolis Studio V11.6

## V11.6 — Hotbath / Sawiday direct
- Recherche Sawiday directe via `https://www.sawiday.fr/chercher/?tn_q=REFERENCE` avant tout moteur externe.
- Repli direct Sawiday Belgique via `/nl-be/zoeken/?tn_q=REFERENCE`.
- Les moteurs Bing/DuckDuckGo/Google ne sont plus que des solutions de secours.
- Accepte les pages produit Sawiday `.fr` et `.be`.
- Cache images fabricant porté en `v116` pour forcer un nouvel enrichissement après déploiement.
- Conservation du filtrage strict des pastilles de finition et visuels techniques Hotbath.

Correctif Hotbath/Sawiday basé sur les logs Render V11.4.

## Causes identifiées

1. Le fallback Hotbath acceptait encore des images génériques `official-page`, ce qui laissait passer les pastilles de finition.
2. Une recherche Sawiday ayant échoué était mise en cache à `null` pour toute la durée du processus Render ; le bouton manuel ne pouvait donc plus réellement réessayer.
3. Bing RSS seul ne suffit pas pour retrouver toutes les références Sawiday, alors que les pages existent et sont indexées.
4. Sawiday publie une image OpenGraph générique avant l’image produit ; elle devait être exclue.

## V11.5

- Une photo Hotbath officielle générique doit maintenant contenir la référence de base dans son URL/nom de fichier.
- Les pastilles de finition, dessins techniques, images `_img`, `lt-rel`, textures et éléments de page sont exclus.
- Le fallback final n’accepte plus aucune candidate globale `official-page` pour Hotbath.
- Recherche Sawiday multi-moteur : Bing RSS → Bing HTML → DuckDuckGo HTML → Google HTML.
- Les redirections `q`, `url`, `uddg` et les URL encodées sont décodées.
- La page Sawiday est toujours revalidée sur le numéro fournisseur Hotbath exact.
- L’image sociale générique Sawiday `/image/content/` est rejetée ; `/image/product/` est fortement priorisée.
- Un échec Sawiday n’est mémorisé que 45 secondes.
- Le bouton manuel efface explicitement ce cache négatif avant de réessayer.
- Les dessins techniques Hotbath JPG restent inchangés.

Logs utiles ajoutés : `[sawiday-search]`, `[sawiday-candidates]`, `[sawiday-hit]`.