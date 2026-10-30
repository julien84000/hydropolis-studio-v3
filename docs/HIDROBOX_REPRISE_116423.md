## V11.64.25 — rendu officiel Hidrobox, toutes les familles (30 octobre 2026)

État de reprise: branche **feat/hidrobox-vanity-tariff-cascade-116425**, PR #71, à fusionner seulement après CI `npm run check`, `npm test`, `npm run build`, `npm run test:browser` vertes. Vérifier que /api/version production renvoie bien 11.64.25 après merge; PR #72 (dimensions receveurs) est **distincte et non automatiquement déployée** par cette PR.

Demande utilisateur: reprendre le configurateur officiel https://hidrobox.com/configurator/en/ pour **toutes** les familles (receveurs, panneaux muraux, vasques à poser, vasques suspendues, vasques sur pied, baignoires, accessoires), sélectionner modèle, matière, texture, couleur, dimensions puis récupérer l'image exacte validée pour le dossier client.

Fait :
- Le navigateur connecté a confirmé 73 collections avec leurs vrais `fltr-collection` et huit catégories `fltr-typology` (1057 douche, 1059 panneaux, 1080 accessoires, 1069 vasques suspendues, 1180 vasques à poser, 1172 vasques sur pied, 1061 baignoires îlot, 1063 baignoires encastrées).
- Image constructeur exacte Spot 62 Kromat Lisse Blush de la page ouverte: `https://hidrobox.com/configurator/wp-content/uploads/cfg-recursos/images/Hidrobox_Washbasin_Spot-62_Blush.png`, résultat portant `Spot-62 RECTANGULAR 32x52`. Collection 929, taille filtre 930, couleur 570, matériau Kromat 729, texture Lisse 803, catégorie 1180.
- `hidrobox-configurator-server.js` utilise les 73 ID, la catégorie explicite et la photo correspondante au nom modèle/couleur et aux dimensions. Les noms d'images inconnus ne sont pas devinés. Une photo ambiguë ou lifestyle n'est jamais marquée correspondante.
- `public/hidrobox-panel-spot-ui.js`: Spot propose les cartes de chacun des modèles, récupérées sur le configurateur constructeur (maximum 2 requêtes parallèles), grand rendu de la sélection et import dans dossier client uniquement si dimension naturelle ≥900px sur les deux axes. Les panneaux muraux font également la demande d'image officielle; un visuel de collection reste explicitement illustratif faute de concordance.
- `public/hidrobox-guided.js`: parcours catalogue générique appelle également le service pour toutes les catégories disposant de modèles, dimensions et caractéristiques clairement validés. Ne remplace jamais une image chargée manuellement par le client.
- `public/hidrobox-panels-2026.js` : 496 lignes de prix et tranches format 2026 et options séparées.
- `public/hidrobox-spot-2026.js` : 48 SKU fabricant et prix avec accessoires.
- Tests: `tests/hidrobox-spot-configurator-image.test.js`, `tests/hidrobox-all-family-configurator-images.test.js`, `tests/hidrobox-panel-audit.test.js`, `tests/hidrobox-vanity-matrix.test.js`.

ATTENTION: disponibilité d'une collection dans le configurateur n'est PAS une preuve qu'une photo exacte existe pour chaque référence. Certaines gammes importées (Program Colour, Artop) ne possèdent pas d'ID officiel dans les 73 entrées et ne peuvent être qualifiées exactes sans nouveau travail fabricant. Les visuels officiels acceptés doivent avoir une correspondance non ambiguë du modèle/couleur/dimensions et une qualité photo validée. Les panneaux Scene Plus Colour constituent une exception réelle à Scene Blanc standard des receveurs.

Prompt de reprise :
« Reprends Hydropolis Studio repo julien84000/hydropolis-studio-v3, PR #71 sur branche feat/hidrobox-vanity-tariff-cascade-116425. Lis docs/HIDROBOX_REPRISE_116423.md. Vérifie le HEAD et la CI, puis fusionne et vérifie Render 11.64.25 si tout passe. Le service doit interroger le configurateur officiel Hidrobox par catégorie/modèle/matière/texture/couleur/dimensions et enregistrer seulement les photos strictement correspondantes. Spot 62 Blush a un fichier natif vérifié. Les gammes sans identifiant officiel n'ont PAS encore de rendu configuré garanti. PR #72 pour les dimensions receveurs est séparée et doit être reprise et vérifiée après cette release. Préserve tous les correctifs des autres marques. »

---

## Checkpoint V11.64.24 — parcours commun des receveurs (30 octobre 2026)

Dernière branche active : `fix/hidrobox-line-twins-series-116424`, PR #70 sur GitHub. Ne pas partir de main tant que la PR n'est pas fusionnée. Vérifier le dernier SHA, la CI, puis la version Render. Production avant cette PR : V11.64.23.

Demande confirmée par l'utilisateur : **modèle (pictogrammes) → matière → texture → finition couleur → dimensions → référence finale**, puis grille/bonde/options et visuel officiel si le résultat fabricant est exact. Chaque collection conserve ses axes réels, avec les champs sans alternative affichés comme fixes. Interdiction de réutiliser les règles d'une famille dans une autre.

Code sauvegardé :
- `public/hidrobox-tray-models-2026.js` : pictos modèle Line X/Y/carré, Twins YL/YR, One (rectangulaire/carré/angulaire), Iconik (rectangulaire/carré), Loovers (To Share, Round C/L/R/Rect., Single L/R), et familles à forme unique si référence documentée.
- `public/hidrobox-tray-cascade-2026.js` : moteur de filtrage tarifaire commun par étapes sur les références fournisseur importées ; caractéristiques fixes Twins Kromat/Microtex, Quadro Kromat/Ardoise, Pure Kromat/Microtex, Arq Kromat/Ciment, Loovers/Unique/Iconik Scene/Lisse. Attention : certaines lignes PDF importées omettent les champs matière et texture à cause des cellules fusionnées ; la correction s'appuie sur les fiches fournisseur, pas sur un défaut universel.
- `public/hidrobox-guided.js` : ordonnancement visuel des cinq étapes, filtration, récapitulatif des références réelles, blocage de l'ajout lorsque le supplément d'une couleur Scene ne peut pas être confirmé. Les images officielles HD restent soumises à la validation des paramètres/dimensions réels.
- Tests `tests/hidrobox-line-twins-series.test.js`, `tests/hidrobox-twins-pictogram-flow.test.js`, `tests/hidrobox-tray-cascade.test.js`, et test audit global `tests/hidrobox-shower-import-audit.test.js` dans npm test.

Points prudents : un choix Scene autre que Blanc doit rester visible, mais son éventuelle plus-value doit être vérifiée dans les pages tarifaires ; ne jamais le vendre au prix BLA sans preuve. Dans les gammes avec champs largeur ou longueur manquants à l'import, ne jamais fabriquer une combinaison ou ajouter une référence incapable de prouver ses dimensions. Les pictogrammes sont des dessins de principe, non des images extraites officiellement du PDF.

Avant fusion : vérifier que `npm ci`, `npm run check`, `npm test`, `npm run build`, `npm run test:browser` passent sur le *dernier commit*. Après fusion : vérifier Render /api/version et /api/health, puis valider à l'écran une configuration de chaque famille et le dossier client.

Prompt de reprise :
"Reprends le dépôt julien84000/hydropolis-studio-v3, PR #70 sur branche fix/hidrobox-line-twins-series-116424. Lis docs/HIDROBOX_REPRISE_116423.md. Vérifie CI et production, finalise le parcours fabricant modèle → matière → texture → couleur → dimensions → SKU pour chaque receveur. Ne généralise pas les matières/textures. Vérifie les vrais tableaux PDF et les images HD officielles. Les options sont séparées du receveur. Ne fusionne et ne déploie qu'avec CI verte et validation de la version Render. Conserve et consigne chaque correctif sur GitHub."

---

## V11.64.24 — Parcours pictogrammes Twins, 30/10/2026

Constat constructeur depuis les planches tarifaires photographiées (pages 26–29) : TWINS est constitué exclusivement de **Twins YL** et **Twins YR**. Pour ces receveurs, seule la matière **Kromat** et la finition **Microtex** sont documentées. Il ne faut PAS proposer Scene, Lisse ou Ardoise dans cette famille. Couleurs autorisées : gammes Basic, Trend et Special selon la ligne de référence, dimensions 80 et 81–90 cm de largeur, longueurs 100–180 cm par tranches tarifaires.

La navigation des sous-modèles utilise désormais le module `public/hidrobox-tray-models-2026.js`, à pictogrammes YL/YR (et Line X/Y/carré); le choix intervient **avant** le filtrage des SKU importés, et seules les lignes STWC correspondant à cette forme restent disponibles. Les dimensions exactes et variantes sont ensuite choisies sans inventer une référence. Les choix de grille/bonde sont indépendants. La sauvegarde conserve `hidroboxConfiguration.submodel` et la réouverture restaure le bon pictogramme. Les modèles des autres collections ne reçoivent pas de pictogrammes inventés s'ils ne sont pas séparables par références documentées.

Tests nouveaux `tests/hidrobox-twins-pictogram-flow.test.js`: les deux seuls modèles, Kromat et Microtex pour tous les STWC, référence YL différente de YR, trois dessins de forme Line dont le carré. Vérifier la CI sur la PR #70 avant fusion, puis /api/health, /api/version et visuels après déploiement.

**Ne pas généraliser les restrictions Twins à Line ou Neo Plus** ; ces collections ont des matériaux et textures différents, à vérifier dans leur grille tarifaire propre. Pour Scene Plus Colour (couleurs autres que blanc), les références BLA imprimées et les suppléments fabricant doivent rester explicitement distingués : ne pas remplacer BLA par BAS/TRE sans code/prix constructeur.

---

# Mise à jour finale de travail — 30 octobre 2026

- Pull request #68 (brouillon) : https://github.com/julien84000/hydropolis-studio-v3/pull/68
- Les tests Node/syntax/build ont été contrôlés dans les exécutions de CI précédentes ; vérifier la dernière CI GitHub sur la tête actuelle avant toute fusion.
- Nouveau `public/hidrobox-shower-options-2026.js`, chargé depuis `public/index.html`, préchargé dans `public/sw.js` : options fournisseur OPSH Line X/Y (bonde Ø50 0/36 €, caniveaux L60/L70/L80 0/38 €), Twins YL/YR (cache-bonde inclus, bonde Ø50 0/36 €), Quadro (Point/Star/Radiance et bonde Ø90), One (grille ONE 0/14 €), Pure/Arq/Iconik (cache-bonde et bonde), Loovers seulement si diamètre de bonde explicitement connu. Pour Unique/Falcon, aucune option non prouvée n'est inventée. Les grilles et options proviennent des pages du tarif source 2026.
- Le configurateur `public/hidrobox-guided.js` affiche ces options et recalcule le prix public HT d'une ligne tarifaire comme `Math.round((prixBrutSource+optionsHT)*104)/100`, en gardant **la référence du receveur** et les références accessoires séparément dans `hidroboxConfiguration.accessories`.
- `public/hidrobox-official-render.js` teste désormais la résolution native d'une photo officielle ; il faut 900 pixels ou plus pour chaque dimension pour l'enregistrer comme HD dans le dossier client. Le code garde la photo de collection illustrative si aucun fichier vérifié et assez grand n'est retourné.
- `tests/hidrobox-shower-options.test.js` valide les options OPSH et le calcul 657 + 38 + 36 = 731 €, +4 % = 760,24 €. `tests/hidrobox-configurator-visuals.test.js` valide les filtres de recherche fabricante et la qualité HD.
- Aucun déploiement de la V11.64.23 au moment de cette note. La V11.64.22 reste la dernière production vérifiée.
- Point restant à auditer : les dix autres familles n'ont pas toutes une matrice tarifaire indépendante par forme/dimension comme Neo Plus ; le moteur universel existant sélectionne les références issues du PDF. Ne pas appeler leur couverture exhaustive sans tests numériques sur chaque famille. Sur le configurateur officiel, certains modèles historiques comme Unique, Loovers, Falcon ne figurent pas dans les filtres vérifiés ; ne pas leur fabriquer de visuel soi-disant exact.
- Après fusion : contrôler `/api/version`, `/api/health`, GET `/api/hidrobox-configurator-image?model=twins-yr&material=Kromat&texture=Microtex&color=Brownie&shape=rectangle&width=90&length=100`, tester un projet client réel, ses aperçus et le PDF.

# Reprise Hidrobox — 30 octobre 2026 — chantier V11.64.23

## État à reprendre sans perte
- Dépôt GitHub: https://github.com/julien84000/hydropolis-studio-v3
- Branche de travail sauvegardée: `feat/hidrobox-shower-trays-visuals-116423`, fondée sur `main` V11.64.22, commit `1fc875fe3f147d1c29251ac0e441bd77a8eca0bc`.
- Render vérifié au début du chantier: `/api/version = 11.64.22`. Ne pas annoncer V11.64.23 déployée avant vérification.
- Tarif source du fournisseur: `HIDROBOX_TARIF_FR_V0226_19-02-2026.pdf` déjà utilisé dans les moteurs existants. Prix public HT = tarif brut +4 % **une fois**. Remise d'achat fournisseur = 50 %, séparée de la remise client. Ne jamais générer un SKU ou un prix sans source tarifaire.
- L'utilisateur veut **tous les receveurs** configurables comme Neo Plus : catégories officielles Neo Plus, Line X/Y, Twins YL/YR, One, Pure, Quadro, Arq, Unique, Iconik, Loovers, Falcon, sans mélanger une variante avec une autre. La navigation actuelle contient 11 familles de receveurs ; les variantes du tarif et du configurateur ne se recoupent pas toujours.
- Le rendu choisi pour le dossier client doit venir du configurateur officiel `https://hidrobox.com/configurator/en/`, d'après modèle, matière, forme, texture, couleur et dimensions réelles. Une image de collection n'est pas une preuve de variante exacte. Photo HD/native si accessible, aucune interpolation prétendue HD. Les options grille/bonde peuvent ne pas figurer visuellement dans l'image.

## Ce qui est réellement sauvegardé sur la branche
1. `hidrobox-configurator-server.js`: route GET `/api/hidrobox-configurator-image` : requête au WordPress AJAX du fournisseur `POST /configurator/wp-admin/admin-ajax.php`, action `_listado_results`, avec `fltr-typology[]`, `fltr-collection[]`, `fltr-material[]`, `fltr-texture[]`, `fltr-color[]`, `fltr-size[]`, `offset=0` et `limit=48`. Identifiants collection/texture/matière/couleur relevés sur le site réel le 30/10 ; taille issue de l'index des liens du site. Chaque carte est contrôlée contre le nom de fichier produit officiel et le titre exact (modèle, couleur, texture, forme et dimensions), jamais première photo par défaut. Résultat absent/incompatible => aucun visuel certifié.
2. `public/hidrobox-official-render.js`: transformateur UI→configuration officielle, recherche de résultat, aperçu, application aux champs `image/images/pdfImage/pdfImages` et `hidroboxConfiguration.officialConfiguratorImage`. Ne pas écraser une photo client personnalisée.
3. `public/hidrobox-guided.js`: couleur réelle supplémentaire sur les receveurs hors Neo Plus (quand la ligne et son groupe couleur l'autorisent), prévisualisation officielle, recherche au clic d'ajout, enregistrement de la couleur et de la configuration ; Neo Plus bénéficie également du visuel officiel après ses choix.
4. `server.js` charge la route ; `public/index.html` charge le résolveur JS ; `public/sw.js` l'ajoute au cache ; `public/app.js` évite la recherche constructeur générique écrasant le nouveau visuel ; tests ajoutés `tests/hidrobox-configurator-visuals.test.js`.

## Contrôles nécessaires avant fusion/déploiement
- Mettre la version V11.64.23 dans `package.json` et `package-lock.json`, ajouter le nouveau test à npm test.
- Ajouter styles pour `.hidrobox-configured-photo` (vignette pleine taille, max-width et max-height) afin de ne pas dégrader la mise en page.
- Revoir le cas `Line X/Y` et `Twins YL/YR` : ne pas arbitrer un modèle si la ligne tarifaire ne donne pas l'orientation. Ne pas extrapoler matériau/texture/couleur spéciale.
- Vérifier que le constructeur répond à `_listado_results` sur Render, teste des images 90×100 et 90×120, et que l'URL officielle `/api/image-proxy?url=...` charge effectivement l'image. Les premiers résultats HTML filtrés étaient parfois incohérents, d'où les contrôles stricts.
- Tests : `npm run check`, `npm test`, `npm run build`, `npm run test:browser` ; puis PR, fusion uniquement si CI verte, `/api/version`, `/api/health`, et parcours complet dans un projet.
- Poursuivre ensuite l'audit tarif PDF des 10 autres familles de receveurs : la ligne universelle actuelle donne des variantes tarifées, mais n'a pas encore une matrice entièrement spécialisée comme Neo Plus pour chaque modèle. Ne pas annoncer cette couverture terminée.

## Prompt de reprise à copier
Reprends réellement Hydropolis Studio, dépôt https://github.com/julien84000/hydropolis-studio-v3, branche `feat/hidrobox-shower-trays-visuals-116423`. Lis `docs/HIDROBOX_REPRISE_116423.md` puis `docs/REPRISE_CHATGPT.md`, vérifie la dernière branche main, les PR et Render avant toute modification. Préserve V11.64.22, tous les fabricants, les devis/dossiers, les tarifs et options existants. Poursuis l'extension de tous les configurateurs receveurs Hidrobox au niveau détaillé de Neo Plus. Vérifie les matrices du PDF 2026 sans prix inventés (majoration +4 % une fois, achat -50 %). Termine la recherche et la transmission au dossier client du vrai visuel produit issu de https://hidrobox.com/configurator/en/ par l'appel WordPress AJAX avec les choix exacts; marque le visuel comme illustratif si un seul champ manque, et préserve les photographies client. Ajoute les tests et le CSS manquants, exécute CI, ouvre/fusionne une PR uniquement après CI verte puis vérifie la version Render, et consigne souvent le travail sur GitHub avec un nouveau prompt de reprise. Ne te contente pas de décrire un plan.
