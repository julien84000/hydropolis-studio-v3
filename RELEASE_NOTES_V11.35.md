# Hydropolis Studio V11.35

## Ritmonio — correctif Scheda tecnica

La V11.34 reconnaissait le lien « Scheda tecnica », mais une seconde anomalie a été identifiée dans la résolution des fiches produit Ritmonio : le HTML d'une page de collection pouvait faire correspondre une référence à la mauvaise fiche produit.

Exemple observé :
- référence demandée : `PR50AF201`
- fiche résolue à tort : `PR50AA201`

### Correctifs V11.35
- identification du produit Ritmonio par le paramètre officiel `code=` de l'URL ;
- suppression du matching trop large sur les blocs HTML contenant plusieurs produits ;
- `PR50AF201` ne peut plus être confondu avec `PR50AA201` ;
- le lien officiel `/download/?code=...` de « Scheda tecnica » est reconnu comme PDF même sans extension `.pdf` ;
- le type PDF de la fiche est conservé dans les articles sélectionnés ;
- dans « Projet par pièce », la case **Inclure la Scheda tecnica** apparaît dès que la fiche est récupérée ;
- si un ancien article reste sans fiche, un bouton **Récupérer la Scheda tecnica** permet de forcer la récupération ;
- la notice « Istruzioni di montaggio » reste gérée séparément.

Aucune modification des prix, remises, photos ou finitions Ritmonio.
