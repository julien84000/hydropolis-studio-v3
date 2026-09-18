# Hydropolis Studio V11.27

## Photos fabricant automatiques et plus rapides

- Chargement automatique des photos fabricant dans le catalogue pour **Nicolazzi, Ritmonio, Zucchetti et Gessi**.
- Préchargement immédiat des 12 premières cartes puis chargement progressif avant apparition à l’écran via `IntersectionObserver`.
- Limitation à 4 recherches simultanées afin de ne plus saturer l’instance Render.
- Cache partagé par référence de base pour **Nicolazzi** et **Ritmonio** : une seule recherche fabricant alimente toutes les finitions d’un même article.
- Cache HTML serveur 6 h et déduplication des requêtes simultanées : les variantes Zucchetti d’une même fiche réutilisent la même page fabricant au lieu de la recharger.
- Lorsqu’un article premium est ajouté au projet, sa photo et ses ressources techniques se complètent désormais automatiquement en arrière-plan.

## Nicolazzi

- Résolution fiabilisée avec la référence générique du tarif (`4808STC..A1`, etc.) plutôt qu’avec la référence commerciale incluant la finition.
- Priorité à l’image pleine résolution de la galerie WooCommerce officielle Nicolazzi.
- Photo produit générique + pastille de finition officielle, conformément au fonctionnement retenu pour Ritmonio.
- Les images de logo ou de navigation ne peuvent plus être retenues comme visuel produit.

## Ritmonio

- Mutualisation du visuel officiel entre toutes les finitions d’une même référence de base.
- Validation du visuel officiel avant conservation dans le cache.
- Conservation des pastilles de finition déjà intégrées.

## Zucchetti

- Même logique fonctionnelle qu’en V11.26, mais accélérée par le cache de page et la déduplication réseau.
- Le chargement devient automatique au fil du défilement du catalogue.

## Gessi

- Conservation du résolveur Area Pro / stockage officiel par référence + finition exacte introduit en V11.26.
- Les images directes restent instantanées ; le moteur automatique sert de filet de sécurité pour les références qui nécessitent un enrichissement.

Aucun tarif, remise fournisseur ou règle commerciale n’est modifié dans cette version.
