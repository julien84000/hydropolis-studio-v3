# Hydropolis Studio V3.8

Correctif ciblé à partir des logs Render.

## Erreurs observées
- `spawn ETXTBSY`
- `Navigation timeout of 35000 ms exceeded`

## Corrections V3.8
1. Chromium est lancé de manière sérialisée et réutilisé entre les recherches.
2. En cas de `ETXTBSY`, le serveur retente automatiquement le lancement.
3. Amphora n'est plus chargé avec `networkidle2`.
4. La page est considérée prête dès `DOMContentLoaded`.
5. Le serveur attend uniquement la présence du sélecteur de finition.
6. Il sélectionne BS / BB / BC, déclenche les événements natifs et jQuery, puis attend uniquement le changement du visuel.
7. Le serveur capture ensuite directement le rendu du produit affiché.

## Test recommandé
Tester dans cet ordre :
- `RE001.BS`
- `RE001.BB`
- `RE001.BC`

Cliquer sur `Trouver / Actualiser la photo` pour chacune.
Les trois visuels doivent être différents.

## PDF client
A4 paysage inchangé :
- produit entier ;
- grandes marges blanches supprimées ;
- petite marge de sécurité ;
- aucune déformation.
