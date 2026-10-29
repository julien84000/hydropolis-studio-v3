# Photos officielles — chantier transversal TOUS les fabricants (29 octobre 2026)

## Objectif pérenne
La consigne utilisateur est d'appliquer à **toutes les marques du catalogue Hydropolis Studio** la même rigueur que pour Hidrobox : menu réel fabricant → catégorie → collection → modèle → variantes, avec photos vérifiées, références et prix d'origine. Aucun changement de tarification ni des projets clients pendant cette mise en forme.

## Modèle de données commun (implémenté V11.64.7)
Le code `public/manufacturer-official-media.js` est un **index fournisseur extensible** accessible par `window.HydroManufacturerMediaIndex.get(manufacturer,collection)`. Les enregistrements sont limités à un fabricant et une collection, avec `scope:'collection'`, URL constructeur et libellé explicite. Ne jamais afficher cette illustration comme une photo exacte de finition/taille et ne jamais recycler une image d'une gamme voisine.

Pour une correspondance exacte référence+finition, ajouter un registre séparé portant cette preuve, ne pas promouvoir silencieusement `scope:'collection'` à `scope:'exact'`. Si la photo disparaît/404, afficher une carte neutre. URLs de photos et fichiers officiels seulement ; audit des droits et de l'accessibilité à maintenir.

## Hidrobox (V11.64.7)
- **30 collections sur 31** possèdent une vignette constructeur dont le fichier et l'URL ont été vérifiés le 29/10/2026 depuis `https://hidrobox.com/wp-json/wp/v2/media` et associés par libellé de modèle. Quelques collections sont illustrées par un modèle représentatif (ex. Kuiper pour Totems) : détails variantes non garantis.
- **Falcon** : images repérées au nom de Falcon mais leurs noms mélangent « Three-collections », trop ambigus pour une vignette garantie. Aucune image Falcon n'est ajoutée : monogramme de repli conservé.
- **Beta Evoque** : une seule image indexée et une seule matrice de prix, accessibles par les deux catégories du site.
- **Neo Plus** : l'écran dédié, le catalogue et l'ajout au projet reprennent la photo spécifique de sa collection, en indiquant qu'elle n'est pas fidèle aux choix de dimension, couleur, grille ou texture.
- **Program, Line, autres collections tarifées** : détail de configuration et image ajoutée au projet portent `imageFinishMatch:'collection'`, sauf photo exacte explicitement déjà fournie pour un article.
- Les groupes non rapprochables, notamment les 969 lignes « Niches, étagères et pièces spéciales », restent transversalement tarifés sans image affectée par supposition ; **4 479 références et +4 % de prix/50 % de remise** préservés.

## Déploiement par fabricant, sans surcharge de GitHub
1. **Bette** — 93 familles et 62 264 déclinaisons, conserver les arborescences de V11.64.6 et la PR #43 (brouillon). Index photo officiel modèle/famille avant l'enrichissement SKU exact. Remise 50 %.
2. **Carrodrain** — 12 groupes tarifés / 635 variantes, familles Essentials/Invisibles/Liquids/Accessoires, images de modèles officielles connues pour la galerie mais revue des associations LOW/PRO et finitions avant l'ajout projet ; remise 50 %.
3. **Sbordoni** — Romana, Palladio, Neoclassica, Masaccio ; garantir l'unique photo de composition lavabo/piètement, les WC et 98 fiches PDF. Ne pas confondre composition, couleur de marbre et référence.
4. **Hotbath, Zucchetti et Lefroy Brooks** — utiliser les index de familles et finitions déjà importés ; photos exactes si correspondance fabricant/modèle/code-finition vérifiée ; ne pas propager une vignette générique à toutes les références.
5. **Gessi** — séries et catégories officielles Areapro, 16 211 tarifs importés ; respecter la distinction du modèle et de sa finition, conserver les fiches techniques.
6. **Dornbracht, Hidrobox (autres composants), Resigres, Sira Concrete, Catalano, Coalbrook, Nicolazzi, Fioranese, TDA/Vismaravetro, Tapware et les autres fabricants révélés par `catalog_manifest.json`** — établir chacun leur couverture réelle, source constructeur, index photos, règles de finition, prix et fiches techniques avant branche/PR indépendante.

L'ordre peut suivre les besoins d'usage, mais **tous** sont dans le périmètre. Réutiliser `tests/manufacturer-image-audit.js` de la PR #48 sans écraser les changements de la PR #43. Pour chaque étape : des tests Node + Chromium desktop/mobile + contrôle du devis et des documents, CI verte, fusion et vérification du Render réellement servi.

## Checkpoint et reprise
Branche : `feat/hidrobox-official-collection-photography-11647` issue de `main` V11.64.6 `5dab52799233746a38469fdf70d90f5f177298af`, préparer V11.64.7.
Fichiers : `public/manufacturer-official-media.js`, `public/index.html`, `public/hidrobox-guided.js`, `public/styles.css`, `tests/v11.64.7-hidrobox-official-media.test.js`, `tests/browser-consolidated.js`.

**Ne pas annoncer déployé tant que PR, CI post-fusion et Render `/api/version` et `/api/health` ne sont pas vérifiés.** Puis ouvrir une PR distincte pour le fabricant suivant plutôt que fusionner les chantiers en cours.
