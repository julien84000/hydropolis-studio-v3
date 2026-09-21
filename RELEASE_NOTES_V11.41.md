# Hydropolis Studio V11.41

## Correctif — ajout des cartes de la seconde ligne / résultats serveur

Le catalogue combine deux sources pendant la recherche : le catalogue déjà chargé dans le navigateur et l’index catalogue du serveur. Avec les gros catalogues compressés, notamment Nicolazzi, des références peuvent apparaître depuis le serveur avant que le fichier `.json.gz` local ait fini de se charger.

En V11.40, les cartes étaient bien visibles mais le bouton d’ajout cherchait uniquement la référence dans `CATALOG`. Les résultats provenant uniquement de `serverSearchRows` ne pouvaient donc pas être ajoutés au projet à ce moment-là.

V11.41 introduit un résolveur unique `productFromCatalogSources(ref, key)` qui cherche d’abord la clé exacte `fabricant|référence` dans le catalogue local puis dans les résultats serveur, avec repli par référence. La clé exacte est propagée par les boutons d’action.

Sont corrigés :

- « Ajouter à la pièce » depuis toutes les cartes du catalogue, y compris les lignes issues de la recherche serveur ;
- ajout depuis Favoris ;
- ajout depuis Comparateur ;
- ajout depuis le comparatif modal ;
- actualisation de photo sur une carte issue du serveur ;
- recherche Hotbath « finition web » sur une carte issue du serveur ;
- relance automatique d’image cassée sur les cartes serveur.

Le socle V11.40 est conservé : recherche automatique d’image au moment de l’ajout, catalogues complets, règles Nicolazzi/Recor/Ritmonio et exports inchangés.
