# Hydropolis Studio V7.7

Corrections :
- « Projet par pièce » est désormais indépendant du chargement des catalogues ;
- normalisation automatique des anciennes données rooms / selected au démarrage ;
- correction de harmonizeSavedCatalogProducts : il mettait à jour room.products alors que les produits sont stockés dans state.selected ;
- renderRooms est protégé : une seule donnée produit incorrecte ne peut plus faire disparaître toute la section ;
- un affichage simplifié de secours apparaît si une erreur produit survient ;
- les catalogues Coalbrook, Catalano, Hotbath, Lefroy Brooks et Recor chargent en parallèle ;
- Zucchetti charge ensuite par lots de 3 fichiers ;
- à chaque lot chargé, les produits déjà sélectionnés sont réhydratés et la section Projet par pièce se met à jour.
