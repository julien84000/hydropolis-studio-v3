# Hydropolis Studio V6.7

Correction critique de la Présentation client :
- le dossier est maintenant généré immédiatement ;
- la récupération des images Catalano se fait ensuite en arrière-plan ;
- aucun appel Catalano ne peut bloquer ou vider la présentation ;
- timeout par requête et par traitement d'image ;
- les anciennes images valides ne sont jamais effacées en cas d'échec ;
- si de nouvelles vues Catalano sont trouvées, le dossier se met à jour automatiquement ;
- message d'erreur visible au lieu d'une page entièrement vide si la génération rencontre une exception.
