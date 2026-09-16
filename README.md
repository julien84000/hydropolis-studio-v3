# Hydropolis Studio V10.16

## Correctif Zucchetti — photos fabricant

La panne de récupération des photos Zucchetti provenait d'une régression serveur : le moteur Zucchetti utilisait une variable `pageMatchesFinish` qui n'était plus définie. La recherche pouvait donc échouer au premier visuel rencontré.

### Corrections
- restauration du matching SKU via le paramètre officiel `?sku=` et le champ « Unique code » de la page Zucchetti ;
- suppression de la référence à `pageMatchesFinish` non définie ;
- exclusion stricte des pastilles de finition, images de produits suggérés et visuels de collections ;
- priorité aux assets qui contiennent la référence produit Zucchetti ;
- distinction entre photo exacte de finition et photo produit générique : pas de faux marquage « finition exacte » ;
- support conservé des pages spéciales `-h` ;
- cache images renouvelé en `v116` afin de ne pas réutiliser les échecs des versions précédentes ;
- logs `[zucchetti-image]` ajoutés pour diagnostiquer SKU, finition et candidats retenus.

## Fiches techniques Zucchetti
- la fiche officielle détectée dans la page reste prioritaire ;
- fallback amélioré pour les références dont la fiche utilise une base de type `ZP8087.X.pdf` ;
- la page 3 reste utilisée comme dessin technique dans le dossier client.

## V10.15 conservée
Les corrections du configurateur Recor V10.15 sont intégralement conservées.
