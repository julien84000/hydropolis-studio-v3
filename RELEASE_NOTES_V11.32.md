# Hydropolis Studio V11.32 — Nicolazzi visuels commerciaux hybrides

## Principe

Le **catalogue PDF Nicolazzi 2024 reste la source de référence** pour les articles, la codification, les prix, les collections et le drawing technique. V11.32 ajoute **Designer Tapware Co** comme source visuelle secondaire pour améliorer fortement la présentation commerciale des produits Nicolazzi.

## Photos Nicolazzi

- Hydropolis tente d'abord une correspondance **par numéro de modèle Nicolazzi** sur Designer Tapware Co.
- Les URL déterministes sont testées en tenant compte de la collection (`Agorà`, `Arena`, `Monte Croce`, `Mac Kinley`, `Classico`, etc.).
- Si nécessaire, un fallback de recherche Shopify est utilisé, mais une fiche n'est acceptée que si le **modèle est confirmé**.
- Une photo commerciale trouvée ne remplace jamais le drawing technique officiel : celui-ci reste l'asset local issu du PDF V11.31.
- Si aucun visuel commercial sûr n'est trouvé, la carte conserve le visuel PDF local de V11.31 plutôt que d'afficher un mauvais produit.

## Finitions

- Quand Designer Tapware Co fournit une photo correspondant au code de finition demandé, Hydropolis l'utilise.
- Sinon, Hydropolis utilise la bonne photo produit et conserve la **pastille de finition Hydropolis**.
- Le cache Nicolazzi est désormais séparé par **modèle + finition**, afin que CR / OS / OG / NS, etc. puissent utiliser des images différentes lorsqu'elles existent.

## Manettes

- Les options de manettes publiées par la fiche Shopify sont récupérées.
- Lorsqu'un visuel de variante est disponible, un **petit aperçu de la manette/configuration** est affiché dans la carte catalogue.
- Les codes de manettes spéciaux du catalogue Nicolazzi, notamment Festival, restent des informations de commande séparées et ne sont pas reconstruits artificiellement.

## Fiches techniques

- Le drawing du catalogue officiel Nicolazzi 2024 reste prioritaire et disponible localement.
- Quand Designer Tapware Co fournit un **datasheet Nicolazzi PDF**, il est également associé au produit comme ressource technique complémentaire.

## Performance

- Le dessin PDF local s'affiche immédiatement comme placeholder.
- La photo commerciale remplace automatiquement ce placeholder en arrière-plan.
- Les fiches Designer Tapware sont mises en cache côté serveur pendant **12 h**.
- Après un premier contrôle, un produit non couvert par le revendeur ne déclenche pas de recherches répétées pendant 12 h.
- Une migration V11.32 purge une seule fois l'ancien cache Nicolazzi V11.31 pour forcer l'enrichissement commercial.

## Commercial

- Majoration tarif public Nicolazzi : **+25 %** inchangée.
- Remise d'achat Hydropolis : **50 %** inchangée.
