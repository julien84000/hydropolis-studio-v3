# Hydropolis Studio V4.0

## 1. Correction du mapping des finitions Amphora

V4.0 ne cherche plus simplement `BB`, `BC` ou `BS` dans le JSON des variations.

Le serveur :
- lit les `<select>` WooCommerce de la fiche Amphora ;
- associe la **valeur technique** de chaque option à son libellé visible (`BS Brushed Steel`, `BB Brushed Black PVD`, `BC Brushed Copper PVD`) ;
- compare ensuite cette valeur aux `attributes` de chaque variation ;
- ne déclare `exact:true` que si la variation WooCommerce elle-même correspond à la finition demandée.

Les images génériques de la page ou du bouton IMAGE ne peuvent plus être certifiées `exact:true`.

En cas d'échec, Render écrit aussi :
`[manufacturer-variation-debug]`
avec les valeurs d'options et les attributs de variations afin de diagnostiquer immédiatement le mapping.

## 2. Drawing / fiche technique

La zone Download Amphora est analysée pour récupérer automatiquement `DRAWING` / `DISEGNO` / `DESSIN`.

Dans le projet, chaque produit disposant d'un drawing affiche :
- `Drawing ↗`
- une case **Inclure le drawing dans le dossier client**

La case est désactivée par défaut.

Si elle est cochée :
- une page A4 paysage dédiée est ajoutée après la pièce correspondante ;
- les PDF techniques sont convertis en image haute définition côté serveur pour être imprimables dans le dossier client final ;
- le drawing est affiché entier, sans déformation.

## Test conseillé

Après déploiement :
1. rechercher `RE001.BS`
2. rechercher `RE001.BB`
3. rechercher `RE001.BC`

Puis vérifier dans Render :
`[manufacturer-image]`

L'objectif est d'obtenir pour chacun :
- `exact:true`
- des `variationId` cohérents avec la finition
- `drawing:true`

Si `exact:false` persiste, copier la ligne `[manufacturer-variation-debug]`.
