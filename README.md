# Hydropolis Studio V10.4

## Hotbath — stratégie de visuel en 3 niveaux

1. **Photo officielle Hotbath** : priorité absolue.
   - La finition n'est maintenant marquée « exacte » que si la page Hotbath affiche elle-même la référence avec le code finition demandé dans `#descrbar`.
   - On ne considère plus automatiquement toute image Hotbath comme exacte.

2. **Recherche web par référence exacte** :
   - bouton « Chercher finition sur le web » ;
   - recherche avec référence complète + code finition + Hotbath ;
   - l'image trouvée est clairement signalée « à vérifier » et n'est jamais présentée comme photo fabricant certifiée.

3. **Simulation de finition Hydropolis** :
   - bouton « Simuler [finition] » lorsque l'on possède déjà un visuel produit ;
   - traitement serveur léger qui conserve volumes, ombres et reflets et applique la teinte de finition Hotbath ;
   - finitions gérées : CR, GN, AB, BB, WH, AI, BBP, BCP et MBP ;
   - dans le dossier client, une simulation porte la mention discrète « Visuel de finition simulé · non contractuel ».

## Documents Hotbath
Les corrections V10.3 sont conservées :
- Drawing JPG reconnu comme dessin technique ;
- Technical info JPG/PDF reconnu ;
- Instructions PDF reconnues ;
- CAD distingué.

## Zucchetti
La correction de rendu PDF multipage reste active : la page 3 est réellement rendue côté serveur.
