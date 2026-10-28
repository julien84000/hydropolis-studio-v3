# Hydropolis — migration vers un modèle visuel commun (référence : Gessi)

## Décision de conception — 28 octobre 2026
Conserver le parcours photographique éprouvé de Gessi comme référence d'interface pour **toutes** les marques. Cela ne signifie pas recopier son moteur métier, ses références ni ses prix.

Parcours cible : fabricant / collection → espace / famille → modèle → variantes de dimensions et de configuration pertinentes → finition → référence exacte et image unique → projet / devis / dossier photo / fiche technique.

## Checkpoint A — Zucchetti, Lefroy Brooks et habillage des guides
Branche : `feat/shared-gessi-visual-pattern-v1164`, partie de `main` `deb83ee86cca5b37ad30b3df8eb95346f78b8cf6`.
- `public/manufacturer-guide.js` : nouvelles cartes de finition visuelles au lieu d'un menu déroulant pour Zucchetti et Lefroy Brooks. La carte affiche une photo seulement lorsqu'elle est qualifiée **exacte pour cette finition** par le résolveur existant ; sinon absence assumée de visuel exact. Références/objets tarifaires d'origine inchangés, ajout via `onAdd(selected)`.
- `public/styles.css` : harmonisation de l'enveloppe des explorateurs Hotbath/Zucchetti/Lefroy Brooks avec l'esthétique Gessi (header sombre, grille claire, photo unique, présentation prix, responsive), sans remplacer les taxonomies.
- `tests/v11.62.3-manufacturer-guides.test.js` : assertions de correspondance finition/référence exacte, exclusion des photos génériques dans les cartes, conservation de prix.
- Le configurateur Gessi lui-même est inchangé. Les règles de remises, tarifs, fiches techniques et configurations des autres marques sont inchangées.

### Périmètre non terminé
- Vérification de la CI complète + tests navigateur ; ce checkpoint n'est pas fusionné ni déployé tant que la validation n'est pas terminée.
- Uniformiser l'ergonomie des configurateurs Sbordoni (composition vasque/piétement), Hidrobox (matière/dimensions), Bette (familles et nombreuses variantes), Carrodrain (modèle/version/longueur), ainsi que les autres marques actives ; **conserver chaque moteur et ses matrices tarifaires**.
- Hotbath : confirmer photo modèle/finition et éviter d'appeler photographie exacte une photo seulement modèle.
- Développer un composant partagé pour la carte de produit / choix de variante **après** validation des premiers parcours, plutôt que de remplacer tous les configurateurs d'un seul coup.

## Précautions permanentes
1. Ne jamais deviner une photo, un PDF, un modèle, une variante ni un tarif.
2. Ne pas supprimer les objets tarifaires ou les corps encastrés ; maintenir prix, remises et lignes à la sauvegarde.
3. Tester les réouvertures et l'export PDF sur chaque marque migrée.
4. Préserver la PR Gessi #45 en cours, et la PR Bette #43 en brouillon. Ne pas fusionner une PR rouge.
5. Ne pas modifier `main` sans relecture des dernières PR et de la CI. Actualiser `docs/REPRISE_CHATGPT.md` à chaque checkpoint.

## Prompt de reprise autonome
Reprends Hydropolis Studio sur `julien84000/hydropolis-studio-v3` en vérifiant d'abord le dernier `main`, les PR #45 et #43 et toute PR plus récente. Lis `docs/REPRISE_CHATGPT.md` et `docs/VISUAL_CONFIGURATORS_MIGRATION.md` sur `feat/shared-gessi-visual-pattern-v1164`. La migration vers la présentation photographique de Gessi a commencé dans `public/manufacturer-guide.js` pour Zucchetti et Lefroy Brooks, avec CSS commun des guides et tests de non-confusion photo modèle/photo finition. Contrôle la CI et les rendus navigateur, puis poursuis fabricant par fabricant (Hotbath, Sbordoni, Hidrobox, Bette, Carrodrain...) sans toucher aux règles de prix, aux pièces de projet ni aux associations de fiches techniques. Committe et documente souvent. Ne fusionne et ne déploie qu'après validation ; confirmer `/api/version` et `/api/health` de Render.

## Checkpoint B — préparation validation de production

La base `main` V11.64.1 (`d33a83c0bbc3e3a7e3ab548d8f28d48865b675fa`) est intégrée par merge sans perte des évolutions Gessi. Version préparée 11.64.2 ; deux fabricants testés sous Chromium (desktop/mobile) dans `tests/browser-consolidated.js`. CI finale à confirmer sur la nouvelle tête de PR #47 ; ne pas fusionner si rouge.
