# Hydropolis Studio V8.1

Correction de l'affichage dans « Projet par pièce ».

## Correctif
Sur les lignes produit, les blocs situés à droite (délai, remise client, prix, compléments assortis)
étaient partiellement coupés, car la grille CSS n'avait pas assez de colonnes explicites.

Cette version :
- redéfinit la grille `.room-product` avec des colonnes explicites ;
- évite la création de colonnes implicites qui débordaient à droite ;
- force les blocs « Compléments lavabo assortis » / options Recor à passer sur une ligne dédiée ;
- améliore le comportement responsive sur écrans intermédiaires et mobiles.
