# Hidrobox — arborescence officielle des produits (V11.64.5)

Source consultée le 29 octobre 2026 : https://hidrobox.com/fr/produits/
Catégories contrôlées sur leurs 9 pages `/fr/produit/<categorie>/` ; les collections proviennent des liens directs `/fr/collections/<slug>/` des pages du fabricant. Ne pas utiliser l'ancien site seg23 comme source pour le menu 2026.

## Arborescence exacte (9 catégories, 32 positions, 31 collections uniques)
1. Receveurs de douche (11) : Neo Plus, Line, Twins, One, Pure, Quadro, Arq, Unique, Iconik, Loovers, Falcon.
2. Panneaux (1) : Paneles.
3. Accessoires (3) : Estantes, Hornacinas, Totems.
4. Vasques suspendus (9) : Program, Program Colour, Lom, Guest, Swap, Titan, Soul, Civit, Intim (*entrée « Privé : Intim » sur le site*).
5. Vasques à poser (1) : Spot.
6. Vasques sur pied (1) : FS.
7. Plans de travail (1) : Artop.
8. Baignoires îlot (3) : Space, Beta Essential, Beta Evoque.
9. Baignoires encastrées (2) : Beta Fusion, Beta Evoque.

**Beta Evoque** apparaît deux fois dans l'arborescence officielle : une seule matrice tarifaire d'origine est utilisée pour les deux accès. Aucune variante de pose ou de dimensions n'est inventée.

## Implémentation
- `public/hidrobox-guided.js` : `CATEGORY` et `HIDROBOX_PRODUCT_TREE` sont la source de vérité de la navigation. `HIDROBOX_ALL_OFFICIAL` garde URL et catégorie. Le parcours est `catégorie → collection → moteur de configuration existant → référence / prix`, avec fil d'Ariane retour.
- **Tarif** : 27 groupes et 4 479 lignes du PDF 2026 restent inchangés ; 26 groupes reliés par identité stricte de collection (alias documenté `Paneles` ↔ `panneaux-muraux`), le groupe « Niches, étagères et pièces spéciales » est maintenu à part dans Accessoires, car il n'est pas prouvé que ses 969 références appartiennent toutes à Estantes ou Hornacinas. Ne pas redistribuer arbitrairement ces articles.
- **Non tarifés** : les collections sans correspondance tarifaire sont consultables via un écran interne explicatif + lien vers le fabricant, sans bouton d'ajout et sans prix fictif. `Intim` reste signalée comme privée.
- **Images** : catégories illustrées avec les images de catégorie déjà enregistrées. Les collections montrent une photo uniquement si elle provient d'une association explicite avec le groupe ; les 27 groupes du tarif ne possèdent actuellement aucun visuel intégré (voir PR #48). Sinon un monogramme de collection remplace la photo, pas une image trompeuse. La recherche des photographies exactes reste à traiter dans la PR #48.
- **Moteur** : Neo Plus conserve sa configuration spécifique (Scene/Kromat, forme, dimensions au cm, texture, grilles) ; autres collections conservées avec leurs facettes originales. Majoration **+4 %**, remise achat **50 %**, prix et enregistrement d'origine inchangés.
- `tests/v11.62-brands.test.js` : 9 catégories, 32 positions, ordre, Beta Evoque x2, Paneles mappée, groupe Accessoires non inventé, 26 groupes de tarification.
- `tests/browser-consolidated.js` : vérification Chromium des 9 catégories, 11 receveurs, Program, collection privée Intim, Beta Evoque aux deux branches, navigation/fil d'Ariane et écran mobile.

## Point de reprise
Branche `feat/hidrobox-official-product-tree-11645` depuis main `75e8c7b6366a1a56c5df8bb023a86a905e8990c6` V11.64.4. Version préparée V11.64.5. PR #48 audit image et PR #43 Bette demeurent indépendantes.
Lancer la CI complète. Corriger les éventuelles régressions, ne fusionner qu'avec les 132+ tests et le Chromium verts, après vérification que `main` n'a pas bougé. Vérifier Render `/api/version` et `/api/health` après livraison. Ne pas prétendre que les images de chaque modèle/finition sont déjà disponibles.
