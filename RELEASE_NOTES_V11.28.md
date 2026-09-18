# Hydropolis Studio V11.28

## Nicolazzi
- Corrige la normalisation des noms de collection accentués (`Agorà` → `agora`).
- Utilise d’abord la route officielle réelle de la collection Nicolazzi.
- Construit et mémorise un index des pages produit de la collection, pagination comprise.
- Les accessoires sans code visible sur la liste sont associés par titre produit strict (ex. `Portasapone / Soap holder`).
- Les produits codifiés sont associés en priorité par référence générique (`4808STC..A1`, etc.).
- Aucun premier résultat générique n’est accepté comme fallback ambigu.
- Le cache navigateur Nicolazzi de V11.27 est purgé une seule fois pour éviter de conserver une ancienne mauvaise photo.

## Performance
- Les requêtes simultanées d’une même collection partagent le même index en cours de construction.
- Les pages fabricant restent mises en cache 6 h.
- L’hydratation automatique des cartes de V11.27 est conservée.
