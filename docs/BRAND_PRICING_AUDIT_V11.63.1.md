# Audit Hidrobox, Bette et Carrodrain — V11.63.1
Date : 28 octobre 2026

## Périmètre vérifié par les tests automatisés

| Fabricant | Groupes de matrice | Variantes tarifaires | Prix HT invalides | Références manquantes | Doubles exacts |
|---|---:|---:|---:|---:|---:|
| Bette | 93 | 62 264 | 0 | 0 | 0 |
| Hidrobox | 27 | 4 479 | 0 | 0 | 0 |
| Carrodrain | 12 | 635 | 0 | 0 | 0 |
| **Total** | **132** | **67 378** | **0** | **0** | **0** |

Ces valeurs proviennent **uniquement des données importées dans le dépôt**, chargées et inspectées par `scripts/audit-brand-pricing.js`. Elles n'établissent **pas** que tous les produits, modèles et finitions du fabricant sont commercialisés ni exhaustivement présents dans notre application.

### Hidrobox
- Source déclarée : `HIDROBOX_TARIF_FR_V0226_19-02-2026.pdf`.
- Les **4 479 variantes** vérifient la règle `prixPublicHT = arrondiCentimes(prixSourceHT × 1,04)` (aucun écart). La remise d'achat **50 %** reste distincte du prix catalogue.
- Nouveau garde-fou au moment de la sauvegarde : si le prix brut manque, est invalide ou si le prix majoré ne correspond pas exactement à +4 %, la configuration n'est pas ajoutée au projet.
- Neo Plus conserve son configurateur dimensionnel dédié ; les 27 groupes de la matrice fournisseur sont sélectionnables par le parcours guidé. Ne pas supposer qu'une collection extérieure à cette matrice possède un prix.

### Bette
- **93 groupes / 62 264 variantes** avec références exactes.
- Le configurateur restaure désormais la référence initiale si le produit l'identifie, même en cas de groupe mis à jour dans le catalogue. Le prix de référence sélectionné doit être positif.
- Lorsqu'une photo précise n'existe pas, une image de collection peut être enregistrée **avec la mention non contractuelle** plutôt que présentée comme une photo exacte de finition.

### Carrodrain
- **12 groupes tarifaires / 635 variantes**. La galerie dispose de **14 modèles de référence**. Les séries **Invisible Disco 125** et **Kerlox** ne figurent pas dans les groupes tarifés de la matrice importée : elles renvoient au site fabricant sans prix automatique. Aucune valeur n'est extrapolée.
- Le choix d'une famille déjà liée à une référence conserve la version, la longueur et la finition quand c'est possible ; un changement réel de famille réinitialise ces options.
- La remise d'achat demeure **50 %** et les prix source 2027 ne sont pas recalculés ou majorés.

## Garanties et limites

1. Les prix publics invalides ne sont plus acceptés au moment d'ajouter un article depuis les configurateurs génériques Bette / Hidrobox / Carrodrain.
2. Les règles commerciales sont enregistrées sans réappliquer une hausse sur une variante déjà majorée.
3. Les anciennes sélections et les identifiants existants restent conservés ; aucun projet client réel de production n'a été migré ou modifié pour cette validation.
4. **Non encore vérifié** : exhaustivité des tarifs par rapport à chaque fichier source fournisseur, véracité de tous les liens techniques, qualité et couverture photographique de toutes les variantes, absence de références retirées par les fabricants.
5. Les correctifs Resigres V11.62.11, les 98 PDF et 99 images Sbordoni V11.63.0, et la taxonomie Hotbath ne sont pas modifiés.

## Reproduction

`node scripts/audit-brand-pricing.js`

`npm run check && npm test && npm run build && npm run test:browser`

Les messages `BRAND_PRICE_MATRIX_AUDIT` et `BRAND_GROUP_COVERAGE` dans GitHub Actions donnent les détails. Voir `docs/REPRISE_CHATGPT.md` pour les checkpoints de livraison. **Ne pas déclarer cette version déployée avant de vérifier `/api/version` et `/api/health` sur Render.**
