HYDROPOLIS STUDIO V11.44 — MISE EN PAGE CLIENT MODIFIABLE

Base
----
V11.42 V4 quantité + V11.43 devis modifiable.

Nouveautés V11.44
-----------------
Dans « Présentation client » :
- bouton « Modifier la mise en page »
- déplacement des blocs produits à la souris
- redimensionnement largeur + hauteur
- déplacement/redimensionnement du titre de page
- déplacement/redimensionnement du texte d’introduction
- grille visuelle légère et aimantation
- verrouillage individuel d’un bloc
- réinitialisation de la page visible
- réinitialisation de toute la présentation
- positions/dimensions sauvegardées avec le projet
- le PDF reprend exactement la disposition personnalisée
- poignées et contours d’édition invisibles dans le PDF

Photos automatiques
-------------------
Quand un bloc produit change de taille :
- la zone photo se redimensionne automatiquement
- l’image conserve ses proportions (object-fit: contain)
- aucune déformation de produit
- la zone texte s’adapte au bloc
- les tailles de texte s’ajustent dans une plage contrôlée

Installation
------------
1. Ajouter à la racine GitHub :
   apply-v11.44-layout.js

2. Conserver :
   apply-v11.42-native.js
   apply-v11.43-quote.js

3. Render > Build Command :
   node apply-v11.42-native.js && node apply-v11.43-quote.js && node apply-v11.44-layout.js && npm install

4. Render > Start Command :
   node server.js

5. Manual Deploy > Clear build cache & deploy

6. Puis Cmd + Shift + R.
