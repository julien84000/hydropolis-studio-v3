# Hydropolis Studio V10.11

## Correctif Hotbath / Sanitairkamer

La recherche de photo Hotbath respecte désormais strictement la règle suivante :

- `B008.GN.IT` → recherche Sanitairkamer avec **B008 uniquement** ;
- `B008.BCP.IT` → recherche Sanitairkamer avec **B008 uniquement** ;
- le suffixe `.IT` et le code finition ne sont jamais envoyés dans la recherche initiale ;
- une fois les pages du produit `B008` trouvées, Hydropolis lit chaque variante et choisit celle correspondant à la finition demandée.

### Décodage de finition
Hydropolis utilise à la fois le libellé couleur et l'article Sanitairkamer :
- GN → `B008GN` / nickel brossé ;
- CR → `B008CR` / chrome ;
- BBP → `B008BBP` / laiton brossé PVD ;
- BCP → `B008BCP` ou `B008BC` / cuivre brossé PVD ;
- MBP → `B008MBP` / noir mat PVD.

### Recherche de page
1. recherche interne Sanitairkamer `q=B008` ;
2. si nécessaire, moteur externe avec uniquement `Hotbath + B008` ;
3. analyse de toutes les pages candidates jusqu'à trouver la bonne finition ;
4. fallback web puis Hotbath officiel uniquement si aucune variante Sanitairkamer correcte n'est exploitable.

### Logs
- `hotbath-sanitair-base-search` : montre la base réellement recherchée ;
- `hotbath-sanitair-page` : montre l'article Sanitairkamer et si la finition correspond ;
- `hotbath-sanitair-result` : montre le visuel retenu.

Le cache fabricant passe en `v111` afin de ne pas réutiliser les échecs Hotbath des versions précédentes.
