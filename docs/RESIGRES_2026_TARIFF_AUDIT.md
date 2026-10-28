# Audit du tarif Resigres FR 2026 — V11.62.8 (Gea CF/SF)

**Périmètre contrôlé** : 38 lignes catalogue / 38 fiches de configuration, réparties en 8 catégories. Chaque article du catalogue trouve une fiche correspondante par combinaison « modèle + type ». Source tarif : `Tarif_FR_2026.pdf` fourni pour le projet. Le fichier source PDF n'est pas hébergé dans ce dépôt ; les prix intégrés restent la source exécutable.

## État de la couverture tarifaire

- **19 groupes** comportent des règles tarifaires importées (grilles, taux au m², au centimètre, prix fixes, tailles ou variantes). Cela ne garantit pas que toutes les déclinaisons soient couvertes : vérifier chaque finition et chaque cellule.
- **8 groupes** disposent d'un configurateur partiel, mais pas de matrice tarifaire suffisante pour calculer tous les prix automatiquement.
- **11 groupes** n'ont pas encore de grille exploitable pour leur ensemble de références ; les prix ne doivent pas être inventés.
- La saisie manuelle est autorisée uniquement si le modèle nécessite une cellule tarifaire manquante **et** que les données de configuration sont cohérentes. Les dimensions invalides sont bloquées.

## État détaillé de chaque groupe

| Catégorie | Modèle | Page tarif | Couverture actuellement implémentée |
|---|---|---:|---|
| Receveur | Extraplano Latéral | 2 | Parcours présent, grille incomplète |
| Receveur | Extraplano Central / 1/4 rond | 4 | Parcours présent, grille incomplète |
| Receveur | Extraplano Contract | 5 | Règles tarifaires importées |
| Receveur | Vento / Vento Contract | 6 | Règles tarifaires importées |
| Receveur | Cosmo / Cosmo Contract | 8 | Règles tarifaires importées |
| Receveur | Urban | 10 | Règles tarifaires importées |
| Receveur | Nix / Nix Contract | 12 | Règles tarifaires importées |
| Plan de vasque | Atenea | 14 | Parcours présent, grille incomplète |
| Plan de vasque | Vento CF | 16 | Règles tarifaires importées |
| Plan de vasque | Cosmo CF | 18 | Parcours présent, grille incomplète |
| Plan de vasque | Urban CF | 20 | Règles tarifaires importées |
| Plan de vasque | Gea CF | 22 | Grille automatique complète : résine, Solid Surface, bois, GPC (8 paliers chacun) |
| Plan de vasque | Contract CF | 24 | Règles tarifaires importées |
| Plan de vasque pour meuble | Selene | 26 | Règles tarifaires importées |
| Plan de vasque pour meuble | Vento SF | 28 | Règles tarifaires importées |
| Plan de vasque pour meuble | Cosmo SF | 30 | Parcours présent, grille incomplète |
| Plan de vasque pour meuble | Urban SF | 32 | Règles tarifaires importées |
| Plan de vasque pour meuble | Gea SF | 34 | Grille automatique complète : résine, Solid Surface, bois (7 paliers chacun) |
| Plan de vasque pour meuble | Contract SF | 36 | Règles tarifaires importées |
| Vasque | Axis | 38 | Prix des déclinaisons non importés |
| Vasque | Ares | 40-41 | Prix des déclinaisons non importés |
| Vasque | Crono | 42-45 | Prix des déclinaisons non importés |
| Vasque | Kos / Neo | 44-45 | Prix des déclinaisons non importés |
| Vasque | Gesto / Frame | 46-47 | Prix des déclinaisons non importés |
| Vasque | Urban | 48 | Prix des déclinaisons non importés |
| Baignoire | Nalu | 50 | Règles tarifaires importées |
| Baignoire | Delia | 51 | Règles tarifaires importées |
| Baignoire | Nesta | 52 | Prix des déclinaisons non importés |
| Baignoire | Vento | 53 | Prix des déclinaisons non importés |
| Meuble | Tiroirs sur mesure | 54 | Règles tarifaires importées |
| Meuble | Portes, vides et colonnes | 56-58 | Parcours présent, grille incomplète |
| Meuble | Frame | 60 | Parcours présent, grille incomplète |
| Meuble | Gesto | 62 | Parcours présent, grille incomplète |
| Miroir | RD / SQ | 64 | Règles tarifaires importées |
| Miroir | FS / FL | 66 | Règles tarifaires importées |
| Miroir | Frame / Gesto | 68 | Prix des déclinaisons non importés |
| Complément | Porte-serviettes | 70 | Prix des déclinaisons non importés |
| Complément | Panneaux / étagères | 71 | Prix des déclinaisons non importés |

## Correctifs V11.62.6

1. **Selene / plans vasques** : « Longueur du plan » puis « Profondeur du plan » ; contrôle de la profondeur maximale, 51 cm pour Selene. Le moteur tarifaire existant calcule 907 € HT pour un plan 150 cm (longueur) × 51 cm (profondeur), une vasque standard, Solid Surface S-Blanco, sans options. Palier applicable : 161 cm, source page 26.
2. **Plans vasques** : affichage du champ de prix manuel seulement pour une cellule tarifaire réellement non renseignée, pas pour une largeur hors limite ou un formulaire incomplet ; la confirmation ne peut plus contourner ce blocage avec un prix antérieurement saisi.
3. **Meubles** : saisie manuelle bloquée pour les configurations incomplètes et incohérentes. Le groupe « Tiroirs sur mesure » conserve ses règles automatiques existantes ; les autres gammes de meubles restent sous réserve des matrices manquantes.
4. **Receveurs** : protection du bouton « Ajouter » si la configuration est invalide, même lorsqu'une ancienne saisie de prix subsiste.
5. **Contrôles automatisés** : test de correspondance des 38 groupes, intégrité des grilles, montants de référence, cas de dimensions inversées, test Chromium de Selene.

## Limites et travaux à poursuivre

La présence d'une grille chiffrée importée ne suffit pas à certifier que toutes les variantes sont exactes au regard du PDF. Les groupes sans grille exploitable nécessitent une extraction et une vérification par tableau source (dimensions, matière, forme, couleur, options). **Aucune estimation automatique ne doit être appliquée à ces cellules tant que la source n'est pas vérifiée.**

## V11.62.8 — import réalisé le 28 octobre 2026

- **Gea CF / page fournisseur 22** : huit paliers (61, 81, 101, 121, 141, 161, 181, 201 cm) × quatre classes matière = **32 cellules tarifaires**. Matières : Pizarra/Lisa = résine, Solid Surface, Bois, GPC. Le 140 × 45 × 5 cm en Bois Nogal US pointe vers le palier 141 cm et la cellule **986 € PVP** sans options. La colonne Bois est commune aux six décors bois du tableau, sans multiplication selon la couleur.
- **Gea SF / page fournisseur 34** : sept paliers (81, 101, 121, 141, 161, 181, 201 cm) × trois classes matière = **21 cellules tarifaires**. Le 140 × 45 cm Bois Nogal US pointe vers **627 € PVP** (épaisseur fixe 1,5 cm).
- **Codage** : `public/resigres_2026_config.json` V7 ; `public/app.js` contrôle les bornes mini/maxi et l'épaisseur Gea CF. `tests/v11.62.6-resigres-audit.test.js` comporte les cas Gea et conserve le test Selene 907 €.
- **Source** : fichier PDF original `Tarif_FR_2026.pdf`, p. 22 et 34 **imprimées** (pages physiques 13 et 19 dans le document de 39 pages). Certaines séquences d'extraction utilisent un codage de police particulier ; les chiffres ont été normalisés en tenant compte du même codage utilisé pour les autres lignes du tarif. Le rendu visuel PDF reste un contrôle supplémentaire souhaitable avant validation commerciale.
- **À poursuivre** : huit matrices configurées mais encore partielles (Extraplano Latéral, Extraplano Central / 1/4 rond, Atenea, Cosmo CF, Cosmo SF, Portes/vides/colonnes, Frame, Gesto) et onze groupes avec prix des déclinaisons non importés. Les autres familles restent inchangées.
- **Validation** : l'import ne constitue pas à lui seul une validation navigateur, de persistance, de marges, de CI ou de production. Consigner ces résultats séparément après exécution réelle.

## Validation technique post-fusion (28 octobre 2026)

- **PR #28** fusionnée : https://github.com/julien84000/hydropolis-studio-v3/pull/28 — commit main `01154323102022ae07c4ca70c08e39f866863eff`.
- **CI #28** réussie, y compris `npm ci`, `npm run check`, `npm test`, `npm run build` et `npm run test:browser` : https://github.com/julien84000/hydropolis-studio-v3/actions/runs/40691087810.
- **PR #29** fusionnée : https://github.com/julien84000/hydropolis-studio-v3/pull/29 — commit main `a97b84e4c12945c9fb500d444632b287b37deccf` ; tests Chromium Gea CF/SF ajoutés (986/627 € au palier 141, progression au palier 161, épaisseur invalide et sélection projet).
- **CI #29** réussie, incluant le parcours Playwright Gea CF/SF : https://github.com/julien84000/hydropolis-studio-v3/actions/runs/40691501892.
- **Render** : `GET /api/version` répond `11.62.8`; `GET /api/health` répond `ok: true` et indique PostgreSQL. Le JSON de configuration servi est `2026-FR-v7`, et expose les prix Bois Gea CF [756, 756, 841, 899, 986, 1094, 1176, 1284] ainsi que Gea SF [483, 538, 590, 627, 681, 760, 794].
- **Limite de vérification** : les tests navigateur s'exécutent sur un serveur local lancé par CI avec une base temporaire. L'ouverture d'une session utilisateur de production et la persistance d'un projet réel après réouverture n'ont **pas** été testées ; ne pas annoncer ces parcours de production comme prouvés.
- **Action suivante** : importer et vérifier les six autres matrices Resigres partielles (en priorité Cosmo CF, Cosmo SF et Atenea), puis receveurs/vasques/meubles/composants ; chaque cellule doit rester liée au tarif source. Compléter les tests de reprise de projet et recalcul de marge.
