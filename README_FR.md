# Hydropolis Studio V11.54

Version complète consolidée, prête à installer. Aucun ancien patch à exécuter.

## Installation
Décompresser le ZIP et placer son contenu à la racine du dépôt de l’application.
Sur Render : Build Command `npm install && npm run build` ; Start Command `npm start`.
Conserver les variables d’environnement et le stockage persistant du service existant.
En local : `npm install`, puis `npm run build` et `npm start`.

## Nouveautés
- Articles libres : désignation, référence, quantité, prix, remise, coût d’achat, délai, photo, fiche technique PDF et notice PDF. Les anciens éléments libres sont convertis automatiquement à l’ouverture du projet.
- Sur chaque article, décocher « Afficher dans le dossier photo » pour le conserver uniquement dans le devis. Il reste dans les totaux et le calcul de marge.
- Aucune option « offert ».
- TDA : mini-configurateur avec gamme, modèle, dimensions de référence, profil et verre issus du fichier tarifaire 2026 fourni ; 308 546 lignes tarifaires.
- Vismaravetro : mini-configurateur collection, modèle, dimensions, profil et verre ; prix issus du tarif janvier 2026 fourni. Les grilles sources et fiches de modèles restent accessibles.
- Sira : modèles, couleurs et dimensions Arctic issus du tarif fourni 2024/25 ; photos des produits extraites de ce document. Les supports et vidages se chiffrent séparément.
- Conditions d’achat TDA, Vismaravetro et Sira : remise fournisseur de 50 %. La remise client est distincte.

## Portée du chiffrage Vismaravetro
101 pages tarifaires disposent de choix successifs. Six pages (PKT, HL, HN, H2, CK et HV) utilisent une sélection du prix dans la grille avec saisie de la configuration. Les variantes non transcrites et les options spéciales doivent être vérifiées sur la grille ; les suppléments confirmés sont saisis avec leur description. Les cotes de fabrication et le sens d’ouverture sont à préciser, notamment en sur mesure. Une composition de plusieurs éléments se chiffre en ajoutant chaque élément. Le configurateur ne valide pas les contraintes de pose.

## Vérifications
Essai navigateur : création et sauvegarde d’un article libre avec photo et deux PDF ; contrôle d’accès aux PDF ; quantité, remise et marge ; masquage du dossier sans retrait du devis ; rechargement ; migration des anciens éléments ; sélection et ajout TDA, Sira et Vismaravetro.
Les ressources locales sont regroupées en archives internes automatiquement servies par l’application afin de maintenir la livraison sous 100 fichiers. Ne pas les décompresser.
Les recherches de visuels distants dépendent de la disponibilité des sites fabricants.
