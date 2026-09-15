# Hydropolis Studio V11.9

## Correctif dossier client Hotbath — Drawing JPG

La V11.8 avait bien supprimé les notices et Technical info Hotbath, mais un produit
déjà ajouté au projet pouvait ne pas avoir encore son `drawingUrl` dans l'état du projet.
Le catalogue connaissait le dessin, mais le dossier client ne le récupérait pas
automatiquement.

### V11.9

- lorsqu'on ouvre **Projet par pièce**, Hydropolis récupère en arrière-plan les Drawing JPG
  Hotbath manquants ;
- lorsqu'on ouvre **Présentation client**, le dossier est affiché immédiatement puis
  Hydropolis récupère les Drawing JPG manquants et reconstruit automatiquement le dossier ;
- un Drawing JPG Hotbath présent est automatiquement marqué `includeDrawing=true` ;
- les anciennes options Technical info et Notice d'installation restent supprimées ;
- le proxy image transmet maintenant la fiche produit Hotbath comme `Referer`, pour fiabiliser
  le chargement du JPG dans l'aperçu et l'export ;
- les logs `manufacturer-image` affichent maintenant `drawingUrl` et `drawingType`.

### Règle Hotbath finale

Dans le dossier client :
- photo du produit ;
- **Dessin technique officiel JPG issu de l'onglet Drawing** ;
- aucune notice d'installation ;
- aucune page Technical info.
