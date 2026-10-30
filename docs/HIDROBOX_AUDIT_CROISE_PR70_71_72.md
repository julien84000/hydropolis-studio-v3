# Audit de reprise Hidrobox — 30 octobre 2026

## État vérifié via GitHub
- PR #70 : orientation Line/Twins, branche `fix/hidrobox-line-twins-series-116424`, package 11.64.24.
- PR #71 : toutes familles/images officielles, branche `feat/hidrobox-vanity-tariff-cascade-116425`, package 11.64.25.
- PR #72 : prix et tranches dimensions receveurs. Distincte de #71 ; aucune incorporation implicite.
- `docs/HIDROBOX_REPRISE_116423.md` sur main contient les checkpoints et les limites de couverture.
- Contrôle de production /api/version et /api/health : non confirmé lors de cette reprise (accès externe indisponible). Aucune annonce de déploiement.

## Risque de fusion croisée
PR #70, #71, #72 modifient toutes `public/hidrobox-guided.js`, `public/hidrobox-neo-plus-2026.js`, `public/hidrobox-tray-cascade-2026.js`, `public/index.html`, `public/sw.js` et le journal de reprise. Elles ne doivent pas être fusionnées mécaniquement ni dans un ordre présumé sans examiner les diffs, rebaser et rejouer les tests.

## Vérifications factuelles
- PR #71 contient des tests pour l'affichage documentaire par collection : fiche technique et notice d'installation lorsqu'un lien officiel existe ; le cas Neo Plus utilise deux URL PDF officielles codées explicitement. Ce n'est **pas** une preuve que toutes les collections ont deux PDF renseignés.
- Le rendu Spot 62 Kromat Lisse Blush a une correspondance source recensée dans le journal de reprise, mais cela ne certifie pas l'ensemble des 73 collections.
- `public/hidrobox-panel-spot-ui.js` recherche une image officielle pour panneaux et Spot, et conserve la mention « image illustrative » en l'absence de correspondance certaine ; la photo n'est appliquée comme image vérifiée que si le contrôle de qualité l'autorise.
- Pour Program Colour, seul un visuel générique est revendiqué : pas d'image de SKU garantie.

## Actions avant validation
1. Lire le HEAD précis des trois PR et les conclusions de CI pour chaque SHA ; vérifier aussi le HEAD main après toute fusion intermédiaire.
2. Comparer les modifications des six fichiers en conflit, conserver à la fois le rendu officiel #71 et les matrices dimensionnelles #72 ; utiliser des tests pour les régressions d'orientation #70.
3. Vérifier les PDF et notices **collection par collection** ; ne jamais indiquer « manuel disponible » sans URL fabricant vérifiée ni faire croire à un document local file://.
4. Parcours navigateur : Neo Plus, Line X/Y, Twins YL/YR, Spot 62, panneau Scene, Program Colour, avec ajout au projet, réouverture et dossier client/PDF. Vérifier correspondance modèle/matière/texture/couleur/dimensions, qualité image et non-écrasement des images personnalisées.
5. Lancer `npm ci`, `npm run check`, `npm test`, `npm run build`, `npm run test:browser` sur l'arbre intégrant tous les changements.
6. Fusionner uniquement après CI verte et compatibilité prouvée ; vérifier réellement `/api/version` et `/api/health` sur Render après déploiement.

## Contraintes conservées
Tarif Hidrobox 2026 majoré de 4 % une seule fois ; remise achat 50 % distincte de la remise client ; aucun SKU, photo exacte ni prix inventé. Aucun changement volontaire aux autres fabricants, devis, dossiers client ou tarifs tiers.

## Exigence prioritaire confirmée : images du configurateur officiel, pas les catalogues
L'image affichée dans le dossier client doit provenir du rendu de https://hidrobox.com/configurator/en/ après passage des paramètres exacts (typologie, collection/modèle, matière, texture, couleur, dimensions, orientation si applicable). Les cartes de collection ne sont qu'un repli explicitement illustratif.

Code inspecté sur PR #71 :
- `hidrobox-configurator-server.js` filtre `_listado_results` sur typology, collection, material, texture, color, size et vérifie la correspondance plutôt que de choisir la première image.
- `public/hidrobox-official-render.js` appelle `/api/hidrobox-configurator-image` et `apply` synchronise `image/images/pdfImage/pdfImages`, en protégeant les images personnalisées.
- `public/hidrobox-guided.js` utilise effectivement ce service pour le parcours universel et Neo Plus ; `public/hidrobox-panel-spot-ui.js` l'utilise pour les panneaux et Spot.
- Ces preuves attestent du raccordement **dans le code de la branche**, pas du fonctionnement intégral sur Render ni de la correspondance pour chaque référence.

Critères d'acceptation complémentaires : sélectionner une référence par famille, ouvrir la page fabricant correspondante, confronter côte à côte couleur/formes/texture/dimensions, enregistrer dans un projet, rouvrir le projet, générer dossier client et export PDF, confirmer le même visuel à chaque étape. En cas de réponse constructeur absente ou ambiguë, laisser l'image de collection marquée « illustrative » plutôt que prétendre à une photo configurée exacte. La qualité native d'impression doit être testée. Tester notamment Spot 62 Kromat Lisse Blush.

## Règle utilisateur de repli visuel — confirmée
Priorité pour toute famille Hidrobox dans le configurateur Hydropolis et dans les dossiers clients/PDF :
1. Visuel de la configuration exacte retourné par https://hidrobox.com/configurator/en/ (modèle, matière, texture, couleur, dimensions et orientation).
2. Si absent : photographie officielle **du produit** dans le catalogue fabricant ou sa page produit sur hidrobox.com, même si la finition illustrée diffère ; ne pas l'étiqueter « finition exacte ».
3. Si absent : photographie officielle **de la collection** sur hidrobox.com, explicitement illustrative.
4. Si aucune image officielle disponible : afficher « image indisponible », sans photo fabriquée, extrapolée ou provenant d'un autre produit.

Conserver la meilleure image trouvée dans le projet, le dossier client et le PDF, sans écraser une image personnalisée. Le repli doit s'appliquer même si le produit n'est pas répertorié dans le configurateur officiel et ne doit pas bloquer l'ajout d'un article tarifé. Vérifier les URL et le chargement réel. Ne pas supposer qu'une photo du catalogue correspond à la couleur configurée.
