HYDROPOLIS STUDIO V11.42 — QUANTITY V4

CAUSES EXACTES CORRIGÉES
1. src.replace(oldText,newText) transformait '$$' en '$'.
   V4 utilise src.replace(oldText,()=>newText), donc
   $$(".room-product").forEach(...) reste intact.

2. Le V3 évaluait ${p...} dans le patcher lui-même et provoquait
   ReferenceError: p is not defined. Ces transformations ont été supprimées.

3. V4 force package.json > scripts.start à :
   node server.js
   afin de ne plus relancer l'ancien apply-v11.42-hotfix.js.

INSTALLATION
1. Remplacer uniquement apply-v11.42-native.js à la racine GitHub.
2. Render Build Command :
   node apply-v11.42-native.js && npm install
3. Render Start Command :
   node server.js
4. Manual Deploy > Clear build cache & deploy
5. Cmd + Shift + R

Résultat attendu :
Qté [-] [1] [+] sur chaque article.
