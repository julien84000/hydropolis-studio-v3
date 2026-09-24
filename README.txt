HYDROPOLIS STUDIO V11.42 — QUANTITY V3

BUG TROUVÉ ET CORRIGÉ
---------------------
La V2 contenait :
  $(".room-product").forEach(...)

Or dans Hydropolis :
  $  = querySelector     -> 1 seul élément
  $$ = querySelectorAll  -> liste d'éléments

Donc .forEach() plantait et aucune quantité ne pouvait apparaître.

V3 utilise bien :
  $$(".room-product").forEach(...)

V3 ajoute aussi trois protections sur les anciennes données projet
(désignation, URL de fiche technique, délai) qui pouvaient faire basculer
le renderer en affichage simplifié.

INSTALLATION
------------
1. Remplacer à la racine GitHub :
   apply-v11.42-native.js

2. Render Build Command :
   node apply-v11.42-native.js && npm install

3. Render Start Command :
   node server.js

4. Manual Deploy > Clear build cache & deploy

5. Cmd + Shift + R

Si un produit provoque encore l'affichage simplifié, la bannière affichera
désormais le vrai message d'erreur sous le texte. Il ne sera plus nécessaire
de deviner la cause.
