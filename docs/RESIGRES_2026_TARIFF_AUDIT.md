# Audit du tarif Resigres FR 2026 — V11.62.6

**Périmètre contrôlé** : 38 lignes catalogue / 38 fiches de configuration, réparties en 8 catégories. Chaque article du catalogue trouve une fiche correspondante par combinaison « modèle + type ». Source tarif : `Tarif_FR_2026.pdf` fourni pour le projet. Le fichier source PDF n'est pas hébergé dans ce dépôt ; les prix intégrés restent la source exécutable.

## État de la couverture tarifaire

- **17 groupes** comportent des règles tarifaires importées (grilles, taux au m², au centimètre, prix fixes, tailles ou variantes). Cela ne garantit pas que toutes les déclinaisons soient couvertes : vérifier chaque finition et chaque cellule.
- **10 groupes** disposent d'un configurateur partiel, mais pas de matrice tarifaire suffisante pour calculer tous les prix automatiquement.
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
| Plan de vasque | Gea CF | 22 | Parcours présent, grille incomplète |
| Plan de vasque | Contract CF | 24 | Règles tarifaires importées |
| Plan de vasque pour meuble | Selene | 26 | Règles tarifaires importées |
| Plan de vasque pour meuble | Vento SF | 28 | Règles tarifaires importées |
| Plan de vasque pour meuble | Cosmo SF | 30 | Parcours présent, grille incomplète |
| Plan de vasque pour meuble | Urban SF | 32 | Règles tarifaires importées |
| Plan de vasque pour meuble | Gea SF | 34 | Parcours présent, grille incomplète |
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
