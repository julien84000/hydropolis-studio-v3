# Hydropolis Studio V4.3

Ajout de deux fabricants au catalogue existant :

- Amphora : catalogue existant conservé.
- Coalbrook : 1483 références issues du tarif EUR août 2026.
- Zucchetti : 12053 références issues du tarif valable à partir du 01/05/2026.

## V4.3
- terminologie produit et finitions affichées en français ;
- prix fournisseur EUR/HT issus des fichiers fournis ;
- recherche multi-marques par référence, désignation, collection, catégorie et finition ;
- Coalbrook : détection des mentions `Requires ... rough sold separately` et ajout du corps d'encastrement lorsqu'il est présent dans le tarif ;
- Zucchetti : détection `Trim Only` et lecture de la référence interne encodée dans le deep-link lorsqu'elle est disponible ;
- liens vers les fiches officielles fabricants ;
- récupération photo/drawing via le moteur fabricant existant, étendu à Coalbrook et Zucchetti ;
- présentation client V4.2 conservée : fond blanc, image et texte centrés.

Attention : lorsqu'un tarif indique qu'une partie interne est nécessaire mais que son prix/référence ne peut pas être résolu automatiquement, l'app conserve le produit mais ne fabrique aucun prix manquant.
