HYDROPOLIS STUDIO V11.42 — QUANTITY V2

CE FICHIER REMPLACE le précédent apply-v11.42-native.js.

Pourquoi l'affichage simplifié apparaissait
-------------------------------------------
Le précédent patch exécutait l'ajout de quantité DANS le même try/catch que
renderRoomsCore(). Si l'ajout quantité rencontrait une erreur, l'application
pensait que le renderer principal avait échoué et basculait en affichage simplifié.

V2 corrige cela :
- renderRoomsCore() reste inchangé ;
- l'ajout de quantité s'exécute après ;
- une erreur de quantité ne peut plus déclencher le fallback ;
- le contrôle Qté fonctionne aussi sur les cartes du fallback.

Installation
------------
1. GitHub, racine :
   remplacer uniquement apply-v11.42-native.js

2. Render Build Command :
   node apply-v11.42-native.js && npm install

3. Render Start Command :
   node server.js

4. Manual Deploy > Clear build cache & deploy

5. Actualisation forcée navigateur : Cmd + Shift + R

Résultat attendu :
Qté [-] [1] [+] dans chaque article.
