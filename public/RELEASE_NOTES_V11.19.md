# Hydropolis Studio V11.19

## Recor — correction haute définition

- Le résolveur Recor ne suppose plus que toutes les fiches utilisent uniquement le suffixe `-en`. Il essaie désormais la fiche anglaise, la fiche sans suffixe puis la fiche portugaise, et valide le titre du produit avant de l'utiliser.
- Suppression du fallback vers la page d'accueil Recor : si la fiche produit exacte n'est pas identifiée, l'application préfère ne pas afficher d'image plutôt que d'associer une mauvaise vignette.
- La galerie WooCommerce officielle devient prioritaire : `a[href]` de la galerie et `data-large_image` passent devant les miniatures WordPress.
- Les images sont maintenant contrôlées après téléchargement : lorsqu'on peut mesurer leurs dimensions, une photo Recor est refusée si elle reste sous le seuil HD (grand côté < 800 px ou petit côté < 500 px). Jusqu'à 4 vues officielles Recor peuvent être conservées pour le dossier client.
- Le cache d'images fabricant est invalidé (`v119`) afin de ne plus réutiliser les anciennes photos Recor basse définition.
- Les baignoires Recor déjà enregistrées dans un projet sont ré-enrichies automatiquement une fois en ligne lors de l'ouverture de V11.19, sauf si l'utilisateur a installé une photo personnalisée.
- La présentation client V11.18 est conservée : baignoire dominante, pieds en petite vignette à côté, vidage en texte sans visuel.

## Vérifications

- Syntaxe `server.js`, `public/app.js` et `public/sw.js` : OK.
- Smoke tests V11 : OK.
- Catalogue : 21 284 lignes, 21 280 couples fabricant/référence uniques, 7 fabricants.
- Fonctions V11.18 conservées : 214/214 côté client et 112/112 côté serveur.
