# Hydropolis Studio V11.3

## Hotbath — nouvelle chaîne de récupération des visuels

La priorité reste le site officiel Hotbath.

1. **Hotbath officiel**
   - photo utilisée comme finition exacte uniquement si la référence affichée par Hotbath
     dans la fiche correspond réellement au code finition demandé.

2. **Sawiday automatique**
   - si Hotbath ne certifie pas le visuel de la finition, Hydropolis recherche automatiquement
     la référence fournisseur exacte sur Sawiday ;
   - exemple : `B008.BBP.IT` → `B008BBP`, `CB003MC.BCP.IT` → `CB003MCBCP` ;
   - la page Sawiday elle-même doit contenir exactement ce numéro fournisseur avant que
     la photo soit acceptée ;
   - le visuel est identifié comme **Source secondaire Sawiday**, jamais comme photo officielle Hotbath.

3. **Recherche web / simulation**
   - les anciens outils restent disponibles en dernier recours.

## Dessins techniques Hotbath

Les ressources Hotbath sont maintenant analysées explicitement par leur rubrique officielle :

- `Drawing` → **JPG du dessin technique** ;
- `Technical info` → fiche technique JPG/PDF ;
- `Instructions` → notice PDF ;
- `CAD` → DWG/IGS/STP/3DS.

Le JPG présent dans **Drawing** est automatiquement coché **Inclure le dessin technique**
lorsqu'un produit Hotbath est enrichi ou ajouté avec ses documents déjà en cache.

Il apparaît ensuite dans la fiche produit du projet et dans le dossier client comme
**Dessin technique**.

## Zucchetti
Correction conservée : page 3 du PDF technique utilisée comme dessin technique.
