# Hydropolis Studio V11.1

## Catalogue corrigé

Cette version corrige les trois points constatés sur iPad après la V11.0.

### Photos automatiques
Les cartes visibles chargent désormais automatiquement leur photo fabricant.
Le chargement est progressif (IntersectionObserver) et limité à 2 requêtes simultanées
pour ne pas saturer les sites fabricants ni Render.

### Vignettes plus compactes
Le catalogue utilise maintenant une grille dynamique d'environ 185 px par carte.
Sur iPad paysage, plusieurs produits peuvent être affichés sur une même ligne au lieu
des deux grandes cartes de la V11.0.

### Images correctement adaptées
Un nouveau proxy serveur `/api/product-image-fit` :
- récupère le visuel fabricant ;
- détecte les grandes marges blanches ;
- recadre automatiquement l'espace vide quand c'est pertinent ;
- conserve le produit entier ;
- renvoie une image optimisée pour les cartes.

Les images utilisent toujours `object-fit: contain` : pas de rognage du produit.

### Héritage V11
Toute la logique métier, les filtres fabricant, Hotbath, Zucchetti, Recor,
les devis, marges, comptes utilisateurs et export client sont conservés.
