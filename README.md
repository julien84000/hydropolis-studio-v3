# Hydropolis Studio V11.33

Hydropolis Studio V11.33 est construit sur **V10.16**, la dernière base stable auditée, avec réintégration contrôlée des apports utiles de la branche V11.12. Il ne s'agit pas d'une réécriture : les projets par pièce, devis/remises/marges, dossier client A4, comptes utilisateurs, PostgreSQL/Supabase et connecteurs fabricants existants sont conservés.

## Ce que V11.23 ajoute

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

Les données livrées couvrent **10 fabricants vérifiés** : Amphora, Catalano, Coalbrook, Gessi, Hotbath, Lefroy Brooks, Nicolazzi, Recor, Ritmonio et Zucchetti, soit **68 600 lignes** de catalogue et **68 596 références fabricant uniques**. Aucun fabricant n’est ajouté sans tarif/catalogue source validé.

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


## Recor V11.19
Le configurateur des baignoires sur pieds propose des choix illustrés pour les pieds Recor. Les visuels sont des références de forme et ne certifient pas la finition photographiée. Le pied sélectionné est repris dans le dossier client.

## Recor V11.19 — images HD
Le connecteur Recor privilégie désormais exclusivement la fiche produit exacte et la galerie WooCommerce pleine définition. Les anciennes images fabricant mises en cache sont invalidées et les baignoires Recor déjà enregistrées sont ré-enrichies automatiquement lors de la première ouverture en ligne.


## Coalbrook V11.21 — CDN officiel

Les photos Coalbrook sont trouvées sur la fiche produit officielle mais sont servies par les CDN dédiés `coalbrook-bathrooms.transforms.svdcdn.com` et `coalbrook-bathrooms.files.svdcdn.com`. V11.21 autorise strictement ces deux hôtes dans le proxy sécurisé et dans l’embarquement serveur des images. Le matching par référence/finition (CP, GM, BB, BN) reste inchangé.


## Recor V11.20 — port fournisseur
- Les 380 € HT de port obligatoire Recor ne font plus partie du prix produit.
- Le port Recor est automatiquement agrégé dans « Port fournisseur HT ».
- Les prix et désignations du dossier client n’affichent plus le port au niveau de la baignoire.
- Le devis conserve une ligne séparée « Port fournisseur HT ».


## Recor V11.22 — PDF techniques protégés
Le rendu des drawings PDF Recor ouvre désormais la fiche produit officielle avant le PDF, réutilise la session/cookies du fabricant et relit le lien « Technical drawing » en direct. Le serveur vérifie également la signature `%PDF-` avant de transmettre le document à pdf.js. Si Recor bloque malgré tout temporairement la conversion, le dossier affiche un lien propre vers le PDF officiel au lieu d'une image cassée.


## V11.23
- Ajout du fabricant Ritmonio (tarif PL39 2025, majoration Hydropolis +5 %).
- Remise fournisseur Ritmonio : 55 %.
- Remise fournisseur Lefroy Brooks mise à 55 %.
- Quand la photo de finition n’existe pas, le visuel affiche la photo produit fournisseur avec une pastille de finition Ritmonio.


### Catalogues gzip V11.25
Les catalogues Ritmonio, Nicolazzi et Gessi sont distribués en `.json.gz`. Le client utilise `DecompressionStream` et le serveur Node utilise `zlib.gunzipSync`. Les pastilles de finition sont embarquées dans `app.js`.


## V11.26
- Correctif des photos Gessi : Area Pro + image officielle exacte par finition, avec exclusion des logos/visuels corporate.


## V11.27

Photos fabricant automatiques dans le catalogue, préchargement par viewport, cache partagé Nicolazzi/Ritmonio, cache serveur 6 h et déduplication des pages fabricant pour accélérer notamment Zucchetti. Les articles ajoutés au projet s’enrichissent également en arrière-plan sans clic manuel.


## V11.28 à V11.30

Les versions intermédiaires ont renforcé Nicolazzi, Zucchetti et Hotbath : cache fabricant, contrôle strict des images Zucchetti par référence et accélération de la recherche Hotbath/Sanitairkamer.

## V11.31 — Nicolazzi 100 % catalogue local

Nicolazzi utilise désormais le tarif/catalogue PDF officiel 2024 comme source visuelle et technique principale. Un pack local compressé contient **481 modèles** couvrant les **15 023 variantes** du catalogue Nicolazzi. Les finitions d'un même modèle réutilisent le même visuel PDF avec leur pastille de finition, tandis que les suffixes de collection/manette (`..A1`, `..91`, etc.) restent distincts. Les familles à manettes séparées, notamment Festival, conservent leurs codes de manettes comme options de commande. Le site Nicolazzi n'est plus requis pour l'affichage normal des cartes.

Le tarif reste majoré de **25 %** et la remise Hydropolis reste de **50 %**.


## V11.32

Nicolazzi passe en mode hybride : le PDF officiel 2024 reste la référence pour les codes, prix et drawings techniques, tandis que **Designer Tapware Co** est utilisé comme source visuelle secondaire vérifiée par modèle pour les photos commerciales, galeries de finitions et aperçus de manettes. En l'absence de correspondance sûre, le visuel PDF local de V11.31 reste le secours déterministe.


## V11.33 — Recor : Projet par pièce simplifié
- Après validation des pieds et du vidage, la liste complète des options Recor disparaît de « Projet par pièce ».
- Seuls les pieds sélectionnés et le vidage sélectionné (ou « aucun vidage ») sont affichés sous la baignoire.
- Les pieds et vidages liés ne sont plus affichés comme articles autonomes dans la pièce ; ils restent conservés dans le projet pour les prix, marges, devis et dossier client.
- Un bouton « Modifier la configuration » rouvre le configurateur avec les choix actuels présélectionnés, sans dupliquer la baignoire.
