# Hydropolis Studio V11.29

## Correctif Zucchetti
- Corrige l’affichage d’une même photo AGORÀ sur de nombreux articles différents.
- Le paramètre `sku` ajouté par Hydropolis ne certifie plus à lui seul la fiche retournée.
- La référence doit être confirmée par le contenu ou l’URL canonique fournie par Zucchetti.
- Le fichier image doit lui-même contenir la référence produit avant d’être accepté.
- Le catalogue utilise en priorité le fichier officiel Zucchetti nommé par référence (`ZAD410.jpeg`, par exemple), après validation du fichier.
- Les images génériques, collections, marketing et produits suggérés sont exclues du résultat final.
- Les anciennes images Zucchetti mises en cache sont supprimées une seule fois après déploiement.

## Comportement sûr
Lorsqu’aucune photo officielle ne peut être associée sans ambiguïté, la carte reste sans photo plutôt que d’afficher un mauvais produit.
