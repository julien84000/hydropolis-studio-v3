HYDROPOLIS STUDIO V11.44 — CORRECTIF DÉPLOIEMENT

Cause exacte corrigée
----------------------
La V11.44 cherchait dans boardItemHtml une ligne :
  const qty=itemQuantity(p);

Cette ligne n'existe plus dans la sortie réelle de la V11.43.
Le patch s'arrêtait donc avec :
  V11.44 — identifiant bloc produit: attendu 1 bloc, trouvé 0

Le correctif aligne V11.44 sur la vraie V11.43 déployée.

Installation
------------
1. Remplacer uniquement à la racine GitHub :
   apply-v11.44-layout.js

2. Build Command Render :
   node apply-v11.42-native.js && node apply-v11.43-quote.js && node apply-v11.44-layout.js && npm install

3. Start Command :
   node server.js

4. Manual Deploy > Clear build cache & deploy

Fonctions V11.44
----------------
- déplacement des blocs de la présentation client
- redimensionnement largeur/hauteur
- verrouillage
- réinitialisation page / globale
- mise en page sauvegardée avec le projet
- photos redimensionnées automatiquement selon le bloc, sans déformation
- export PDF conservant la disposition personnalisée
