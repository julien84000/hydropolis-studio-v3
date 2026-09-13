# Hydropolis Studio V3.9

## Changement d'architecture

V3.9 supprime complètement Chromium/Puppeteer pour la recherche des photos Amphora.

La recherche se fait désormais directement dans le HTML officiel Amphora :
1. récupération HTTP de la fiche produit ;
2. lecture des données WooCommerce `data-product_variations` ;
3. association variation -> finition BS / BB / BC -> image officielle ;
4. le lien `IMAGE` générique reste uniquement un fallback non certifié.

## Pourquoi

Les logs Render V3.8 montraient :
- `Navigation timeout of 25000 ms exceeded`
- `Waiting failed: 10000ms exceeded`

Ces erreurs venaient de l'automatisation navigateur et non du catalogue produit.

## Test

Tester :
- RE001.BS
- RE001.BB
- RE001.BC

Dans les logs Render, chaque recherche affiche maintenant une ligne :
`[manufacturer-image] {...}`

Le champ `exact:true` signifie que l'image provient directement de la variation WooCommerce correspondant à la finition demandée.
