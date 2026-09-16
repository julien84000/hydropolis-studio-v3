# Hydropolis Studio V10.10

## Hotbath — priorité Sanitairkamer

Cette version donne la priorité aux visuels produit récupérés sur **sanitairkamer.nl** pour Hotbath.

### Nouvelle logique photo Hotbath
1. Normalisation de la référence : suppression du suffixe pays/langue (`.IT`, `.FR`, etc.) et séparation du code finition.
2. Recherche prioritaire sur `sanitairkamer.nl` avec la **référence de base** (ex. `B008`) ; la finition est ensuite déduite via le contenu de la page (titre, breadcrumbs, sélecteur couleur).
3. Sélection de l'image produit principale en excluant logos, vignettes accessoires et dessins techniques.
4. Si aucun résultat exploitable n'est trouvé sur Sanitairkamer, repli sur la recherche web existante.
5. En dernier recours seulement : photo officielle fournisseur Hotbath, même si la finition n'est pas certifiée.

### Important
- Les **documents techniques Hotbath** restent récupérés depuis la fiche officielle Hotbath.
- Les suffixes comme `.IT` ne servent plus à la recherche d'image.
