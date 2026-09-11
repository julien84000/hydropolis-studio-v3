# Hydropolis Studio V3.3 — Update Render

## 1. Photos Amphora selon la finition
La V3.3 lit maintenant les données de variations WooCommerce présentes dans la fiche officielle fabricant.

Exemple :
- `RE001.BS` → variation BS
- `RE001.BB` → variation BB
- `RE001.BC` → variation BC

L'objectif est de récupérer l'image associée à la variation sélectionnée par le site, et non le visuel initial de la page.

## 2. Dossier client A4 paysage
Le dossier reste en 297 × 210 mm.

Avant insertion dans le PDF, la photo produit est automatiquement préparée :
- suppression des grandes marges blanches inutiles autour du produit ;
- ajout d'une petite marge de sécurité ;
- conservation du produit en entier ;
- aucune déformation ;
- `object-fit: contain` dans le cadre final.

Le résultat doit donc montrer un produit plus grand tout en conservant l'intégralité du visuel.

## Test recommandé
1. Rechercher `RE001.BC`.
2. Cliquer `Trouver la photo fabricant`.
3. Vérifier que le robinet est bien cuivre brossé.
4. Ajouter le produit à SDB MASTER.
5. Ouvrir `Aperçu PDF`.
6. Vérifier que le produit est entièrement visible et occupe correctement son cadre.
