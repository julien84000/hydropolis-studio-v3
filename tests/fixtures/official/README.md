# Sources des fixtures fabricant

Relevés effectués les 30 septembre et 1er octobre 2026 sur les sources officielles, recherchées avec Exa. Les fichiers sont des extraits minimaux des réponses réelles. Aucune photo ni variation n’est fabriquée.

- ALPI : https://alpirubinetterie.com/prodotti/ et POST `https://alpirubinetterie.com/wp-admin/admin-ajax.php`, action `webkolm_ajax_product_popup`, identifiant dans `alpi-samples.json`. Les extraits conservent référence, image et téléchargements.
- Gessi : `https://g-ecatalogue-be-prod-we.azurewebsites.net/public/product/GetProductDetails?country=FR&language=fr&productCode=75051` (article remplacé pour chacun des dix fichiers). Les données utiles sont `productId`, `finitureId` et `specificFeatureProductImg`.
- Sira : URL officielle de chaque modèle dans `public/sira_models.json`. Les extraits conservent le titre, le sélecteur de pigments, `data-product_variations`, la galerie et les PDF. Les références WooCommerce Glacier/Bay ont des incohérences sur le site : l’association couleur/image repose sur les attributs de variation et le titre de la page.

Ces fixtures valident les parseurs, le cache et les parcours UI. Elles ne prouvent pas la disponibilité réseau depuis Render. Les contrôles HTTP réels des 117 images figurent dans `docs/image-url-validation.json`.
