# Hydropolis Studio V10.14

## Correctif Recor — baignoires sur pieds

Le configurateur Recor ajoute désormais la baignoire, le jeu de pieds obligatoire et les éventuels accessoires **en une seule opération atomique** avant le rendu et la sauvegarde du projet.

Corrections :
- normalisation de la pièce cible avant ajout ;
- suppression de l’état intermédiaire « baignoire sans pieds » ;
- ajout baignoire + pieds + vidage en un seul commit ;
- conservation du lien `accessoryFor` entre la baignoire et ses pieds/vidage ;
- retour automatique vers « Projet par pièce » après validation ;
- logs dédiés `[Recor configurator open]` et `[Recor configurator add]` ;
- z-index renforcé pour la fenêtre de configuration.

Les pieds restent obligatoires pour les modèles concernés. Collins reste exclu de cette règle car ses pieds sont déjà intégrés dans la référence.
