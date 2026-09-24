HYDROPOLIS STUDIO V11.44 — FIX2 DÉPLACEMENT / REDIMENSIONNEMENT

Cause exacte
------------
Les styles historiques de Présentation client utilisent !important :
- position: relative !important
- width/height: auto !important
- placement grid !important

La première V11.44 appliquait des styles normaux, donc Chrome les ignorait.
Les poignées étaient visibles mais le bloc ne bougeait pas réellement.

FIX2
----
- position/left/top/width/height forcés avec priorité !important
- grid-column/grid-row neutralisés lors d'une personnalisation
- déplacement opérationnel
- redimensionnement opérationnel
- zone image recalculée avec la taille du bloc
- zone texte recalculée
- images conservées en proportions via object-fit: contain
- contrôles d'édition placés au-dessus des visuels

Installation
------------
Remplacer uniquement à la racine GitHub :
apply-v11.44-layout.js

Build Command Render :
node apply-v11.42-native.js && node apply-v11.43-quote.js && node apply-v11.44-layout.js && npm install

Start Command :
node server.js

Puis Manual Deploy > Clear build cache & deploy
et Cmd + Shift + R.
