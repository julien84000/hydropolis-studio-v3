# Hydropolis Studio — Audit photographique de tous les configurateurs

Date : 28 octobre 2026. Base de départ : `main` V11.64.2, commit `4823e664cd852e90a61f4bc2f43888aaf1c6f3ec`. Travail en PR #48 (**brouillon, non déployé**).

## Règle produit
Chaque article doit présenter une photographie de **son modèle** dans son configurateur. Lorsque la finition exacte est documentée, afficher son image exacte. Une photo du même modèle dans une autre finition doit porter « modèle illustratif, finition non contractuelle ». Ne jamais remplacer par un autre modèle ou une photo de catégorie en la présentant comme exacte. Les prix, références, sauvegarde, documents techniques et conditions commerciales ne doivent pas changer.

## Ce que mesure l'audit
Le script `tests/manufacturer-image-audit.js` inventorie 108 175 lignes tarifaires (manifeste catalogue) ainsi que les matrices configurateur compressées. Il distingue les champs `image` **déclarés**, les index officiels de modèle/finition, la présence de fichiers/miniatures locaux, les liens non résolus et les matrices de variantes. **Il ne valide PAS les URL distantes, les générateurs d'images à la demande, ni toutes les photos réellement visibles dans le navigateur.** Les chiffres « aucune image déclarée » ne signifient donc pas « aucune photo dans l'interface ».

## Résultats démontrés (extrait du run CI #40782256861, 133 tests réussis)
| Fournisseur | Références | Associations de photos constatées dans l'inventaire | Limite |
|---|---:|---:|---|
| Sbordoni | 5 216 | 4 613 photos locales résolues par l'endpoint exact `/api/sbordoni-image` | 603 références sans mapping individuel, notamment certaines références de marbre |
| Zucchetti | 12 053 | 538 modèles indexés ; l'audit rapproche 5 102 références de l'index modèle | 6 951 lignes sans image ni modèle indexé *dans ce seul circuit* ; aucune association photo finition documentée |
| Lefroy Brooks | 3 397 | 68 modèles indexés, 200 associations référence/finition | 3 197 lignes sans image ni modèle indexé dans le circuit analysé |
| Hotbath | 2 554 | 12 collections, 1 594 références rapprochées à un visuel modèle | 960 lignes sans rapprochement par ce circuit ; 209 anciennes URL explicitement répertoriées comme non remplaçables sans vérification |
| Gessi | 16 211 | 130 associations exactes de finition indexées (128 lignes retrouvées par l'audit) | L'API et les chargements visuels dynamiques officiels ne sont pas mesurés |
| Bette | 62 264 variantes / 93 groupes | Aucun champ photo de variante ni de groupe dans la matrice tarifaire | Pages officielles et galeries à rapprocher des **modèles** sans prétendre correspondance dimension/coloris |
| Hidrobox | 4 479 variantes / 27 groupes | Aucun champ photo de variante ni de groupe dans la matrice tarifaire | La vue utilise des illustrations de catégorie ; il faut des photos officielles par collection |
| Carrodrain | 635 variantes / 12 groupes | Aucune image dans la matrice ; 14 modèles dans la galerie constructeur séparée | Rapprocher les photos de collection du groupe tarifé ; finition exacte non établie |

Pour Alpi, Catalano, Coalbrook, Dornbracht, Fioranese, Nicolazzi, Resigres, Ritmonio, Sira Concrete, TDA et Vismaravetro, les champs image du tarif analysé sont majoritairement vides : **ne pas en inférer une absence de photos affichées**. Plusieurs mécanismes de recherche et rendu dynamiques existent, hors périmètre du script.

## Ordre de correction
1. **Bette / Hidrobox :** collecter les photos exactes par modèle depuis les fiches officielles et constituer une table de correspondance vérifiée modèle→page→image (d'abord 93/27 groupes). Après vérification, rattacher une photo illustrative du modèle à chaque variante sans changer prix ni références. Pour les couleurs/formes non photographiées, mentionner la limite.
2. **Sbordoni :** vérifier les 603 références manquantes à l'aide des planches d'origine et de la nomenclature exacte ; aucune substitution entre variantes de marbre sans validation.
3. **Hotbath :** auditer les 209 échecs d'archives et utiliser les images actuelles constructeur uniquement sur matching exact collection + modèle.
4. **Zucchetti, Lefroy Brooks, Gessi et autres :** enrichir l'index par référence/finition quand la source est vérifiée ; distinguer photographie de modèle et photo de finition.
5. Test navigateur desktop/mobile par famille, y compris les images cassées après `load` et la persistance dans le projet/dossier photo.

## Source et prochaines étapes
PR : https://github.com/julien84000/hydropolis-studio-v3/pull/48
Run audit initial : https://github.com/julien84000/hydropolis-studio-v3/actions/runs/40782256861
Les images catalogue du fournisseur doivent être utilisées uniquement si les droits/conditions le permettent, sans copier une image pour une autre référence non documentée.

## Prompt de reprise
Reprends Hydropolis Studio en vérifiant `main` et toutes les PR récentes ; lis ce rapport et `tests/manufacturer-image-audit.js` de la PR #48. L'utilisateur veut une photo par article dans **tous** les configurateurs. Ne prétends pas 100 % tant que les URL officielles ne sont pas vérifiées et les cas sans photo ne sont pas résolus. Commence par Bette (93 groupes/62 264 variantes), Hidrobox (27/4 479) et Sbordoni (603 absences d'index) puis Hotbath (209 archives). Insère uniquement des visuels officiels correspondant au modèle, identifie toute finition non exacte. Sauvegarde fréquemment, teste Node + Chromium et la base tarifaire avant fusion/déploiement.