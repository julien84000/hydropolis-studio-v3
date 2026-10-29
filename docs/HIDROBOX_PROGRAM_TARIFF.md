# Hidrobox Program et dimensions — correctif du 29 octobre 2026

Base auditée : main 7a3b534, version 11.64.8. Branche fix/hidrobox-tariff-program. Préserve les neuf familles Hidrobox et les photos déjà intégrées.

## Constat et correction
L'import générique mélangeait des options OPWB (vasques seules, équipements) aux plans WPRC et perdait certaines dimensions des cellules fusionnées du PDF. Program passe désormais par un moteur dédié : forme/hauteur du plan, famille et dimensions de vasque, Curve, vasque additionnelle, équipements, dimensions exactes, récapitulatif et ajout d'une composition unique. Les tarifs existants ne sont pas réécrits ; les anciens projets restent conservés.

Source : HIDROBOX_TARIF_FR_V0226_19-02-2026.pdf fourni par Julien. Extraction des pages imprimées 76–83 (pages physiques 40–43), empreinte SHA256 dans public/hidrobox-program-data.js. Reproductible par scripts/extract-hidrobox-program.py CHEMIN_PDF. Les 56 lignes WPRC, les 52 variantes S réellement détaillées dans ces pages et 133 options codifiées sont extraites du PDF. Le titre marketing « 38 formes » ne représente pas le nombre de variantes détaillées. Textes sources conservés sous tests/fixtures/hidrobox.

Calcul : prix du plan selon L × profondeur × hauteur + supplément de la première vasque + supplément de vasque additionnelle selon son type (215 / 256 / 318 / 359 / 441 / 584 €) + Curve 123 € (L, R ou L+R) + options. Majoration 4 % sur le total une seule fois ; achat 50 % du prix majoré. Chaque ligne source et ses codes sont sauvegardés avec la configuration, ainsi que les dimensions exactes.

31 régions du PDF rendues en images : formes Neo Plus, silhouettes de hauteur, Curve, photographies de familles de vasques. Elles sont chargées uniquement à l'ouverture d'une configuration Hidrobox, pas pour les autres marques. Les images ne prétendent pas représenter la composition complète.

## Limites explicites
- Les prix des porte-serviettes présentent plusieurs divergences entre p.81 et p.83 ; seul le L35 intégré concordant est chiffré. Les autres bloquent le prix final et demandent confirmation.
- Crédence murale robinetterie : 759/758 € et tranche 82–101/82–141 incohérentes entre les tableaux. Pas de prix final fabriqué.
- Découpe spéciale +10 % : dessin et assiette du supplément à confirmer, pas de calcul arbitraire.
- Compatibilité dimensionnelle élémentaire et contraintes de hauteur contrôlées ; implantation détaillée et dégagements à confirmer par le fabricant, particulièrement pour deux vasques et accessoires latéraux.
- Program Colour et les autres collections utilisent encore leur parcours existant. Leur audit exhaustif des cellules fusionnées reste à effectuer. La forme Neo Plus à évacuation centrale n'a pas été ajoutée sans matrice de référence dédiée vérifiée.
- Neo Plus : étiquettes des tranches corrigées à 100–110 et 120–130 aux bornes basses ; matières/textures invalides refusées.

## Validation / reprise
Tests spécifiques ajoutés : 56 tranches, géométries, supplément additionnel sans double comptage, majoration/remise, incompatibilités et options contradictoires. Tests navigateur existants adaptés pour le moteur Program, puis choix additionnel + Curve + robinetterie et rejet d'une profondeur incompatible. CI et déploiement à vérifier avant annonce.

Prompt : Reprends la branche fix/hidrobox-tariff-program, lis ce document et docs/REPRISE_CHATGPT.md, vérifie les PR et main. Finalise la validation navigateur, le contrôle des crops et de la sauvegarde/réouverture Program. Ne chiffre pas les options signalées ambiguës sans preuve fournisseur. Préserve les règles +4 % puis remise achat 50 %, les autres marques et toutes les données clients. Sauvegarde, ouvre/actualise la PR, fusionne uniquement après CI verte et vérifie Render.

Contrôle complémentaire : Neo Plus n'affiche plus Lisse pour Angulaire L/R lorsqu'aucune ligne de cette texture n'existe ; les textures proposées sont filtrées par forme/dimensions/matière. Régression navigateur Angulaire L 80×120 Kromat → Ardoise, SNEC0181, ajout actif.
