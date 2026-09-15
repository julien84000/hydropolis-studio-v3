# Hydropolis Studio V11.11

## Hotbath — choix utilisateur pour le dessin technique

La V11.10 avait volontairement forcé le Drawing JPG Hotbath dans le dossier client
pour résoudre le problème d'affichage. Cette version rétablit la règle métier correcte :

- Hydropolis récupère automatiquement le **Drawing JPG officiel Hotbath** ;
- le lien reste visible dans la fiche produit ;
- une case **« Inclure le dessin technique dans le dossier client »** permet de décider
  article par article s'il doit apparaître dans le dossier ;
- la case est **décochée par défaut pour les nouveaux produits** ;
- le choix est sauvegardé avec le projet ;
- décocher la case supprime la page Drawing du dossier client ;
- cocher la case l'ajoute ;
- le chargement direct Hotbath + fallback proxy de V11.10 est conservé.

Pour Hotbath, `Technical info` et `Instructions` restent exclus du dossier client.
Seul le Drawing JPG peut être inclus, sur choix de l'utilisateur.
