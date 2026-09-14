# Hydropolis Studio V7.4

Correction photos Recor :
- résolution des fiches officielles recor.pt/product/<modele>-en/ conservée ;
- nouveau lecteur spécifique des galeries WordPress Recor ;
- récupération des images depuis og:image, img, srcset, picture/source, lazy-load,
  background-image CSS et URLs d'assets présentes dans le HTML ;
- classement prioritaire des images contenant le nom exact du modèle ;
- exclusion des logos, icônes et visuels d'interface ;
- jusqu'à deux visuels officiels Recor par baignoire ;
- intégration Recor au système d'image embarquée côté serveur afin d'éviter les blocages anti-hotlink ;
- cache fabricant V7.4 pour invalider les anciennes recherches Recor sans résultat ;
- les images base64 temporaires ne sont toujours pas conservées dans localStorage.
