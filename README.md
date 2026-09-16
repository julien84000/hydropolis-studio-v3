# Hydropolis Studio V10.8

## Hotbath — correctif images

Cette version corrige le problème observé dans V10.7 : le site Hotbath peut encore référencer
des fichiers image historiques qui renvoient HTTP 404.

### Nouvelle logique
1. Le suffixe catalogue `.IT` reste affiché mais n'est jamais utilisé pour le matching technique.
2. Les pastilles de finition Hotbath (`BBP.jpg`, `BCP.jpg`, etc.) sont totalement exclues des photos produit.
3. Seule l'image principale de `#imgprod` est considérée comme photo officielle fournisseur.
4. Cette image est testée côté serveur avant affichage ; une URL 404 n'est plus envoyée au navigateur.
5. Si la finition officielle exacte n'est pas exploitable, Hydropolis recherche automatiquement une image web avec la référence exacte.
6. Si aucune image exacte n'est trouvée mais que la photo fournisseur officielle fonctionne, cette dernière est conservée en dernier recours, même avec une finition différente.
7. Une image distante en erreur est remplacée par un placeholder propre : aucune icône d'image cassée.

## Hotbath — documents techniques

Le parsing est désormais explicite :
- section `Drawing` → JPG utilisé comme **Drawing 2D** ;
- ce même JPG est aussi utilisé comme **fiche technique Hotbath**, conformément au besoin métier ;
- section `Instructions` → notice PDF ;
- section `CAD` → fichier CAD/DWG séparé.

## Zucchetti

Les corrections précédentes restent inchangées :
- image par SKU ;
- fiche PDF multipage ;
- page 3 réellement rendue comme dessin technique.
