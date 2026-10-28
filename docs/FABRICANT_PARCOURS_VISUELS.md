# Hydropolis Studio — règles d'interface des configurateurs fabricants

Ce document accompagne les tarifs, il ne les remplace pas. L'objectif est de reproduire la **logique visuelle de navigation** des sites fabricants avec les assets dont l'origine et la référence sont établies, sans copier d'autres éléments sans rapport avec les produits.

## Contrat transversal
1. D'abord la **collection** : nom d'origine, photo de collection autorisée et lien source.
2. Puis les **espaces / catégories officielles** : ne pas fabriquer de catégories alternatives depuis un mot-clé tarifaire si le fournisseur fournit sa taxonomie.
3. Afficher ensuite une **grille de photos produit**. Un article par vignette : image carrée, article entier, référence visible et nom court. Pas de duplication d'une photo pour des modèles voisins.
4. Ensuite seulement les **variantes techniques et finitions** : chaque option modifie sa référence et son prix selon le tarif fabricant ; photo exacte si certifiée, sinon « photo du modèle — finition illustrative ».
5. Afficher la provenance et le statut : `model` / `exact-finish` / `missing`. Les photos absentes restent identifiables sans faux rendu. Les erreurs de chargement ne doivent pas vider silencieusement la grille.
6. Lorsque le produit dépend d'un corps encastré, piétement ou pièce optionnelle, préserver la dépendance, les références multiples et leur prix de façon transparente.
7. Contrôler l'ajout au projet, la réouverture du projet, la fiche technique, le dossier photo et les exports PDF par tests de non-régression. Ne pas remplacer le produit sélectionné par la simple image du catalogue.

## Fabricants et différences de parcours

| Fabricant | Parcours visuel de référence | Contrôles de prix / variantes |
|---|---|---|
| **Hotbath** | 12 collections → 53 catégories réelles → grille photographique des références → déclinaison finition | Voir `brand-guide-hotbath-taxonomy.json`, `brand-guide-hotbath-media.json` ; 631 des 647 associations illustrées en V11.63.2, 16 non certifiées. |
| **Zucchetti** | Collections → espace → photos de produits → finition, corps techniques éventuels | Images et dimensions du modèle doivent correspondre à la référence, pas à un visuel de catégorie. |
| **Lefroy Brooks** | Collections historiques → typologie (lave-mains, douche, bain) → modèles → finitions | Respecter noms et logos de collections et références des compléments encastrés. |
| **Sbordoni** | Collection ROMANA / PALLADIO / NEOCLASSICA / MASACCIO → vasque avec dimensions / trous → piétement éventuel → rendu de la composition | Un visuel de composition finale, pas trois illustrations d'articles dissociées. Conservations des 98 PDF techniques et 99 JPEG de compositions. |
| **Hidrobox** | Collection → produit → forme / matière → dimensions → finition → prix | Prix de base majoré +4 % une seule fois, remise d'achat séparée du prix public. |
| **Bette** | Gamme → silhouette / catégorie → dimensions → versions et options → visuel vérifié | Variantes et 62 264 lignes importées ; photos exactes si vérifiées, sinon indication « collection illustrative ». |
| **Carrodrain** | Collection de caniveau → choix de longueur / grille / finition → référence | Tarif de la combinaison exacte, remise 50 % conservée ; grille conforme au fabricant. |
| **Resigres** | Forme/collection → matière/coloris → modèle → dimensions/options | Grille de fournisseur, empêcher toute extrapolation de prix hors tableau, cf. V11.62.11. |

## État V11.63.2 — Hotbath
- 367 nouvelles photos retrouvées dans les 53 grilles historiques Hotbath.it, en plus des ressources Hotbath.com ; fichier de provenance exact par référence et par collection.
- 631 associations illustrées sur 647 dans les 12 collections (97,5 %). Ne pas extrapoler au-delà des 16 références non vérifiées.
- Grille de tuiles carrées à fond clair et produit non recadré, référence **sous** la photo ; CSS limité à `.mg-hotbath-official`. 
- Tests UI : existence des tuiles et chargement navigateur des images historiques ; distinction explicite du visuel du modèle et d'une finition illustrée.
- Ces vérifications de **couverture d'index** ne suffisent pas à garantir le chargement permanent des URLs sur les serveurs du fabricant : prévoir le contrôle de disponibilité au chargement et le suivi des échecs.

**Procédure de livraison** : sauvegarder chaque étape sur GitHub, CI (unit/build/Chromium), fusion après CI verte, puis vérifier `/api/version`, `/api/health`, et les assets exposés par Render. Une branche sauvegardée n'est pas une version en production.
