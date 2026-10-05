# Hydropolis Studio 11.57.2 — pagination du devis et cartes du projet

Base : main `20b768127a993a9d27c99a1084d6277a6460129c` (11.57.1).

## Corrections

- Un sous-espace n'est plus répété lorsque sa liste d'articles continue à la page suivante. Le titre apparaît au changement d'espace ou de pièce. Alignement à gauche et regroupement des articles de 11.57.1 conservés.
- Les contrôles d'un article (visibilité dossier, délai, remise, prix et quantité) sont regroupés dans une grille qui s'adapte à la largeur de sa carte. L'image, la désignation et la suppression restent en tête de l'article.
- Les anciennes règles à colonnes fixes contradictoires ont été retirées de la source CSS. Les pièces peuvent rester côte à côte sans que les articles débordent sur la pièce voisine.
- Aucun changement de catalogue, prix, référence, finition, média, calcul financier ou logique de quantité. Moodboard hors périmètre.

## Validation

- `npm run check` : 21 fichiers JavaScript valides.
- `npm test` : 31/31 tests.
- `npm run build` : SUCCESS.
- `npm run test:browser` : 28 contrôles catalogue + 32 contrôles régression, aucune erreur JavaScript.
- Grille projet testée à 2048, 1440, 1024, 760 et 390 px : aucun débordement ni chevauchement des cartes/contrôles ; 14 articles conservés, article libre compris.
- Éditeur d'article ouvert contenu dans sa carte ; modification de quantité vérifiée dans l'interface, avec synchronisation du corps associé.
- Devis de deux pages : une seule occurrence de chaque sous-espace de la pièce ; 14 lignes et total HT 1510 € conservés. Aperçu projet contrôlé visuellement.
- 16 catalogues : volumes inchangés, dont Gessi 16211 variantes.

Le test précédent exigeant un sous-espace répété au début de chaque page a été remplacé pour refléter la demande explicite du 5 octobre. Le test des cartes a initialement compté 13 articles au lieu de 14 : la migration existante transforme également la ligne libre en carte ; le décompte du test a été corrigé, sans modifier cette migration.

## Publication

Validation locale terminée. Les résultats CI, la fusion et le contrôle réel des fichiers servis par Render sont consignés dans la PR. Le projet client réel n'est pas disponible dans la base de test ; aucune vérification visuelle de ses données en production n'est revendiquée.
