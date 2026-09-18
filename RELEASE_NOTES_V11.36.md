# Hydropolis Studio V11.36

## Ritmonio — Scheda tecnica, correctif définitif du flux

La V11.35 affichait encore « Récupérer la Scheda tecnica » sur certains articles. La récupération des documents partageait encore trop de logique avec la recherche de photo et dépendait des slugs de collection.

### Nouvelle architecture
1. Hydropolis retire la finition de la référence Ritmonio (`PR50AF201IBX` → `PR50AF201`).
2. Le serveur interroge directement la recherche officielle Ritmonio :
   `https://www.ritmonio.it/it/ricerca/?code=PR50AF201`
3. Il accepte uniquement l'URL produit dont le paramètre `code=` correspond exactement à la référence.
4. Il ouvre cette fiche produit et récupère :
   - `Scheda tecnica`
   - `Istruzioni di montaggio`
5. La Scheda tecnica est enregistrée comme PDF et la case **Inclure la Scheda tecnica** apparaît dans « Projet par pièce ».

Cette récupération est désormais indépendante du moteur photo. Elle fonctionne également pour les accessoires Ritmonio (`78G001`, `78Q007`, etc.) dont les collections catalogue ne correspondent pas aux slugs du site.

Le bouton « Récupérer la Scheda tecnica » utilise lui aussi ce nouveau endpoint dédié et affiche une erreur explicite si Ritmonio ne fournit réellement aucun document.
