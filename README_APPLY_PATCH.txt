HYDROPOLIS STUDIO V11.42 — PATCH CUMULATIF

Base vérifiée
-------------
Hydropolis Studio V11.40
Dépôt : julien84000/hydropolis-studio-v3
Commit audité : 5be697dc941916c49eb5d89c3f2c368fb161ab50

Contenu
-------
- Quantité native 1 à 999 par produit
- Boutons − / + + saisie directe
- Quantité pour éléments libres
- Recalcul prix, remise, achat, marge, devis, Excel
- Synchronisation quantité baignoire Recor -> pieds/vidages
- Quantité visible dans le dossier client
- Stabilisation des produits issus de la recherche serveur
- Protection SSRF ajoutée à la simulation de finition
- Nettoyage des anciennes copies backend sous /public

Application
-----------
1. Placer le contenu de ce ZIP à la racine de la V11.40.
2. Exécuter :
   node apply-v11.42.js
3. Puis :
   npm run check
   npm test

Le patch refuse de s'appliquer si package.json n'est pas en version 11.40.0.
