# Hydropolis Studio V11.16 — Catalano official-first + galerie dossier client

## Correctif Catalano

- La recherche d'images Catalano commence systématiquement sur la fiche produit officielle `catalano.it`.
- Le connecteur cible d'abord l'image `previewSrc` du **code exact / finition exacte** exposée par Catalano.
- Il récupère ensuite **toutes les images distinctes de `#product-gallery`** de la fiche produit officielle.
- Les images des accessoires, fittings, produits liés et grilles de collection sont explicitement exclues.
- Un fallback reste prévu pour les anciens templates Catalano, mais il reste limité au bloc produit officiel.
- La référence exacte / finition exacte est placée en premier lorsqu'elle est disponible.

## Dossier client

- Toutes les images Catalano disponibles pour la référence sélectionnée sont conservées dans le projet.
- Le dossier client génère des pages **Galerie fabricant — Catalano** supplémentaires, jusqu'à 6 images par page, et autant de pages que nécessaire.
- Aucune limite arbitraire de 5 ou 8 photos n'est appliquée au dossier Catalano.
- Une mention prévient que les vues d'ambiance officielles peuvent montrer une autre finition que celle de la référence sélectionnée.
- Les anciens projets Catalano sont rafraîchis une fois afin de récupérer la galerie complète.

## Fiabilité

- La construction du tableau d'images mélange correctement les images embarquées côté serveur et les URLs proxifiées : une image non embarquée n'est plus perdue si une autre image dispose déjà d'un `dataUrl`.
- Les fonctions et fabricants des versions précédentes sont conservés.
