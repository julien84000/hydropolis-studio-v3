HYDROPOLIS STUDIO V11.42 — PATCH CORRECTIF QUANTITÉS

CE PATCH REMPLACE LE PRÉCÉDENT.

Le problème du précédent patch
-------------------------------
La logique quantité était dans un script de transformation mais ce script
n'était pas garanti d'être exécuté par le service Render existant.

Cette version ne dépend plus du buildCommand Render :
package.json lance automatiquement le hotfix AVANT server.js à chaque démarrage.

Fichiers à mettre à la RACINE du dépôt GitHub
----------------------------------------------
- package.json                    -> REMPLACER l'actuel
- render.yaml                     -> REMPLACER l'actuel
- apply-v11.42-hotfix.js          -> AJOUTER
- apply-v11.42-from-v11.41.js     -> AJOUTER / REMPLACER

Ne pas placer ces fichiers dans un sous-dossier.

Après le push GitHub
--------------------
1. Laisser Render redéployer.
2. /api/health doit annoncer Hydropolis Studio V11.42.
3. Faire Cmd + Shift + R.
4. Projet par pièce doit afficher sur chaque article :
   Qté  [-] [1] [+]

Le hotfix est idempotent : au redémarrage il détecte que la quantité existe
déjà et ne réinjecte pas le code.

Fonctions quantité
------------------
- 1 à 999 unités par article
- quantité par élément libre
- total article = PU x quantité
- vente nette / coût achat / marge recalculés
- devis et Excel utilisent la quantité
- pieds et vidages Recor liés suivent la quantité de la baignoire
