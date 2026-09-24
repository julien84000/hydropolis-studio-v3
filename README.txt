HYDROPOLIS STUDIO V11.43 — DEVIS MODIFIABLE

Cette version conserve la V11.42 V4 qui fonctionne et ajoute un éditeur
de devis dans la section « Marge & devis ».

Fonctions
---------
- UNE LIGNE PAR ARTICLE, sans regroupement automatique
- Référence modifiable
- Désignation modifiable
- Délai modifiable
- Quantité modifiable
- Prix unitaire HT modifiable
- Remise ligne modifiable
- Total ligne recalculé
- Bouton de réinitialisation par ligne
- Bouton de réinitialisation globale
- Modifications reprises dans le devis client / PDF
- Modifications reprises dans Excel
- Marge et totaux commerciaux synchronisés
- Éléments libres également présents ligne par ligne

Installation
------------
1. Ajouter à la racine GitHub :
   apply-v11.43-quote.js

2. Conserver apply-v11.42-native.js (V4) tel quel.

3. Render > Build Command :
   node apply-v11.42-native.js && node apply-v11.43-quote.js && npm install

4. Render > Start Command :
   node server.js

5. Manual Deploy > Clear build cache & deploy

6. Puis Cmd + Shift + R.

Le patch a été simulé sur le dépôt GitHub actuel après application de la
V11.42 V4 : syntaxe JS validée et quoteRows vérifié sans regroupement.
