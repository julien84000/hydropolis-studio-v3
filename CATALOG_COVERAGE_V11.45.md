# Couverture catalogues — V11.45

## Fioranese 2025

- 57 collections représentées.
- 1 132 lignes `pricingStatus=verified`.
- 921 lignes tarifées au m², toutes avec un `sqmPerBox` positif.
- 98 lignes tarifées à la pièce.
- 1 ligne tarifée à la composition (`Fio. Rainforest`).
- 3 familles maintenues en `pricingStatus=pdf` parce que l'extraction du tableau ne permet pas d'associer de façon certaine chaque prix à la bonne colonne/finition :
  - Fio. Brick
  - Fio. Glossy Brick
  - Fio. Passepartout

Ces trois accès ne créent pas d'article à 0 €. Ils renvoient vers la collection / le tarif afin d'éviter un chiffrage erroné.

## Resigres 2026

- 38 modèles/familles issus du sommaire du tarif FR.
- structure des pages conservée jusqu'à la page 71 + exemples de pièces de rechange page 72.
- couleurs, finitions et champs de configuration centralisés dans `public/resigres_2026_config.json`.
- seuls les suppléments lisibles sans ambiguïté sont calculés automatiquement.
- le prix de base reste manuel lorsqu'une matrice PDF ne permet pas une correspondance sûre ligne/colonne.
