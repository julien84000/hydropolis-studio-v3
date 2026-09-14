# Hydropolis Studio V7.5

Correction critique : catalogue vide.

Cause probable :
- catalog_extra.json contient maintenant plus de 21 000 références et pèse environ 14 Mo ;
- le démarrage attendait entièrement son téléchargement + parsing avant d'appeler renderCatalog ;
- sur Render, cela pouvait laisser la zone Résultats entièrement vide pendant le chargement.

Corrections :
- Amphora s'affiche immédiatement dès l'ouverture ;
- les autres marques se chargent ensuite en arrière-plan ;
- après chargement, filtres et résultats sont actualisés automatiquement ;
- renderCatalog est désormais défensif : une référence mal formée ne peut plus vider tout le catalogue ;
- message d'erreur explicite si un problème d'affichage survient.
