# Hydropolis Studio V3.7

## Correction de la photo de finition
La V3.6 récupérait encore la même image car Amphora peut changer le rendu affiché après la sélection sans exposer une nouvelle URL exploitable.

La V3.7 :
1. ouvre réellement la fiche fabricant dans Chromium ;
2. sélectionne la finition BS / BB / BC ;
3. déclenche les événements natifs et jQuery ;
4. attend le changement de rendu ;
5. capture directement les pixels du visuel produit affiché ;
6. envoie cette capture à Hydropolis Studio.

On ne dépend donc plus de l'URL de l'image après sélection.

## PDF
A4 paysage conservé, avec produit entier, suppression des grandes marges blanches et aucune déformation.

## Test
Comparer :
- RE001.BS
- RE001.BB
- RE001.BC

Les trois vignettes doivent devenir visuellement différentes.
