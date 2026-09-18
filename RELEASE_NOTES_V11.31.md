# Hydropolis Studio V11.31 — Nicolazzi catalogue PDF local

## Changement d’architecture Nicolazzi

Le site public Nicolazzi n’est plus la source principale des visuels produit. Le **Listino Prezzi 2024 officiel (434 pages)** devient la source de référence pour l’affichage et les drawings Nicolazzi.

- **481 modèles produit** sont indexés localement depuis le PDF officiel.
- Les **15 023 lignes Nicolazzi** du catalogue conservent leurs prix, collections, références et finitions ; chaque variante de finition réutilise le visuel de son modèle maître.
- Les cartes Nicolazzi utilisent immédiatement `/api/nicolazzi-pdf-asset` : aucune recherche Internet Nicolazzi n’est nécessaire pour l’affichage normal.
- Le même asset local sert de **drawing technique** dans le projet/dossier client.
- Les finitions restent représentées par les pastilles Nicolazzi intégrées à Hydropolis.
- Les variantes de collection/manette restent distinctes : par exemple `4808STC..A1` (Star) et `4808STC..91` (Flag) ont chacun leur propre visuel catalogue.
- Pour les familles comme **Festival**, les codes de manettes externes restent des options de commande séparées (ex. `FEFF05`, `FEFF06`) et ne sont pas fusionnés artificiellement dans la référence produit.
- Si une référence n’existe pas dans l’index PDF local, Hydropolis laisse le visuel vide plutôt que d’utiliser une image web ambiguë.

## Performance

- Visuels Nicolazzi servis localement et cacheables un an (`immutable`).
- Les cartes Nicolazzi ne passent plus dans la file de recherche automatique distante.
- Purge unique de l’ancien cache navigateur Nicolazzi lors du passage à V11.31.

## Commercial

- Majoration tarif public Nicolazzi : **+25 %** inchangée.
- Remise d’achat Hydropolis : **50 %** inchangée.

## Correctifs antérieurs conservés

- V11.30 Hotbath : cache/déduplication et arrêt après correspondance exacte Sanitairkamer.
- V11.29 Zucchetti : rejet des images génériques non certifiées par référence.
- Tous les connecteurs et fonctionnalités projet/dossier client existants sont conservés.
