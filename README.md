# Hydropolis Studio V11.18

Hydropolis Studio V11.18 est construit sur **V10.16**, la dernière base stable auditée, avec réintégration contrôlée des apports utiles de la branche V11.12. Il ne s'agit pas d'une réécriture : les projets par pièce, devis/remises/marges, dossier client A4, comptes utilisateurs, PostgreSQL/Supabase et connecteurs fabricants existants sont conservés.

## Ce que V11.18 ajoute

- nouvel accueil visuel Hydropolis Studio inspiré des principes d’ergonomie Apple/Canva ;
- navigation simplifiée avec Accueil, Catalogue, Projets, Favoris, Comparateur et Exports ;
- favoris persistants par utilisateur ;
- comparateur plein écran jusqu’à quatre références ;
- hub d’exports PDF / Excel / moodboard ;
- raccourcis visuels par univers produit et inspirations depuis l’accueil ;

- interface V11 plus visuelle : rail fabricants, cartes produits, KPI projet, barre de statut et navigation modernisée ;
- recherche fédérée : catalogue local instantané + index catalogue serveur, avec cache navigateur hors connexion ;
- alternatives intelligentes basées sur catégorie, collection, fabricant, finition, libellé et proximité de prix ;
- comparateur jusqu'à 4 produits, sans ajouter automatiquement les suggestions au projet ;
- meilleure lecture du prix, de la finition et de la disponibilité. L'application n'invente pas de stock : sans donnée fournisseur vérifiée, elle affiche « disponibilité à confirmer » ;
- exports PDF existant + Excel XML `.xls` + moodboard PNG ;
- mode hors connexion pour l'interface, les catalogues déjà mis en cache et les projets déjà ouverts dans ce navigateur ; les modifications sont conservées comme brouillon local puis resynchronisées explicitement ;
- index fabricants extensible et manifestes séparés pour faciliter l'ajout de nouveaux catalogues ;
- correctifs de fiabilité : restauration TVA à 0 %, protection des brouillons locaux, duplication des pièces jointes, révocation de session après changement de mot de passe ;
- durcissement des proxys distants : rejet des réseaux privés/locaux, domaines initiaux autorisés et limites de taille ;
- réintégration du Drawing JPG Hotbath de V11.12 avec session/référent Hotbath, tout en conservant le fallback photo Sanitairkamer de V10.16 ;
- conservation des règles Recor (pieds obligatoires) et Zucchetti (dessin technique page 3).

## Catalogues inclus

Les données réellement livrées restent celles des **7 fabricants vérifiés** : Amphora, Catalano, Coalbrook, Hotbath, Lefroy Brooks, Recor et Zucchetti, soit 21 284 lignes de catalogue avant dédoublonnage. La V11 prépare l'élargissement de la base mais n'ajoute volontairement aucun fabricant fictif sans tarif/catalogue source validé.

## Vérifications

```bash
npm install
npm run check
npm test
npm start
```

`npm run check` vérifie la syntaxe du serveur et de l'application. `npm test` contrôle les fichiers V11 essentiels, les 7 fabricants, le volume catalogue et les fonctions structurantes (offline, recherche serveur, comparaison, exports et garde-fous serveur).

## Déploiement

Le serveur continue d'utiliser `DATABASE_URL` pour PostgreSQL/Supabase. Sans `DATABASE_URL`, il bascule sur le stockage local de développement. Ne pas déployer le mode fallback local comme stockage de production.


## Recor V11.18
Le configurateur des baignoires sur pieds propose des choix illustrés pour les pieds Recor. Les visuels sont des références de forme et ne certifient pas la finition photographiée. Le pied sélectionné est repris dans le dossier client.
