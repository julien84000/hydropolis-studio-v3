HYDROPOLIS V11.42 — BUILD FIX

Important :
Le dépôt GitHub contient encore l'ancien apply-v11.42-hotfix.js.
N'écrase plus ce fichier.

1. Ajouter à la RACINE du dépôt ce nouveau fichier :
   apply-v11.42-native.js

2. Vérifier qu'un nouveau commit GitHub a bien été créé.

3. Dans Render > Settings > Build Command, mettre exactement :
   node apply-v11.42-native.js && yarn install

4. Start Command :
   node server.js

5. Manual Deploy > Clear build cache & deploy

Le nom unique évite toute confusion avec les anciens patchs V11.42.
