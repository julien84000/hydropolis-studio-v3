# Hydropolis Studio V6.8

Correction du bug d'ajout de produits et de photos.

Cause identifiée :
- le cache fabricant stockait des images base64 dans localStorage ;
- le navigateur atteignait sa limite (« exceeded the quota ») ;
- cette exception interrompait addProduct avant renderRooms ;
- le produit existait donc en mémoire et pouvait apparaître dans le dossier client, tout en n'apparaissant pas correctement dans « Projet par pièce ».

Corrections :
- photos officielles fabricant stockées comme URLs proxy légères ;
- plus de base64 pour les images fabricant ;
- cache fabricant V6.8 protégé contre les dépassements de quota ;
- anciens caches fabricant lourds supprimés automatiquement ;
- saveState ne peut plus interrompre l'interface ;
- produit affiché immédiatement dans « Projet par pièce » avant la recherche photo ;
- l'onglet Projet par pièce se resynchronise à chaque ouverture ;
- galerie Catalano multi-images conservée.
