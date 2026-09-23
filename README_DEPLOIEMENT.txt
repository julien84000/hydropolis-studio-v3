HYDROPOLIS STUDIO V11.42 — AUTO DEPLOY POUR TON DEPOT ACTUEL

Pourquoi la quantité n'apparaissait pas
---------------------------------------
Le ZIP précédent contenait un patcher, mais le dépôt GitHub restait en V11.41.
Render exécutait uniquement "npm install" puis "npm start", donc apply-v11.42.js
n'était jamais lancé.

Ce pack corrige précisément ce problème.

A METTRE A LA RACINE DU DEPOT GITHUB
------------------------------------
1. apply-v11.42-from-v11.41.js
2. render.yaml  (remplacer l'ancien render.yaml)

Render va alors exécuter automatiquement :
node apply-v11.42-from-v11.41.js
puis installer/vérifier/démarrer l'application.

VERIFICATION APRES DEPLOIEMENT
------------------------------
- la barre latérale doit afficher V11.42 ;
- dans Projet par pièce, à droite de chaque article :
  Qté  [−] [1] [+]
- l'API /api/health doit renvoyer Hydropolis Studio V11.42.

Faire une actualisation forcée du navigateur après le déploiement :
Mac : Cmd + Shift + R

IMPORTANT
---------
Ce pack est conçu pour la V11.41 actuellement présente sur ton dépôt.
Il ne dépend pas de la V11.40.
