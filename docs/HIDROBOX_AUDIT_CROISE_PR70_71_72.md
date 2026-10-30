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
