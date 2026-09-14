# Hydropolis Studio V5.1

## Coalbrook — correctif renforcé des photos
- recherche prioritaire avec le SKU exact sur le moteur officiel Coalbrook (`/products?keywords=...`) ;
- vérification de la référence sur la fiche produit avant utilisation ;
- contrôle de la collection Bank / Domo / Decca / Zurich ;
- détection prioritaire des URLs d'image contenant la référence complète, ex. BA1005BB ;
- les pastilles de finition restent exclues ;
- cache fabricant V5.1 pour supprimer tous les anciens résultats.

## Éléments techniques
Pour Coalbrook et Zucchetti, le projet propose désormais des cases indépendantes :
- Inclure la fiche technique ;
- Inclure la notice d'installation ;
- Inclure le drawing 2D lorsqu'il est en PDF/image.

Les fichiers DWG Coalbrook restent accessibles par lien mais ne sont pas rendus dans le PDF client.
La fiche technique Coalbrook (Spec Sheet) peut être cochée et ajoutée au dossier client.
Pour Zucchetti, un fallback officiel vers `assets.zucchettidesign.it/uploads/downloads/pdf/REFERENCE.pdf`
est utilisé si le lien Technical Sheet n'est pas directement exposé dans le HTML.
