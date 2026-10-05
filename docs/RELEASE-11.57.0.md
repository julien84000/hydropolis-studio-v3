# Hydropolis Studio V11.57.0

Validation du 5 octobre 2026, reprise exclusivement depuis `fix/v11.57-sira-pdf-audit`, HEAD initial `c1b410edfeaecfdf79c380ba905786441e99ebfe`. Base main comparée : `a5c6c6b2abd61a56bd2fc50d1259ebe7cb510d1f`.

## CONFIRMÉ

- Le HEAD initial correspond au dernier navigateur vert : [exécution GitHub 37282198993](https://github.com/julien84000/hydropolis-studio-v3/actions/runs/37282198993).
- Le diff complet conserve les correctifs Sira, Hotbath, devis, Excel, Gessi et les fonctions dashboard/catalogue restaurées. Aucun nouveau correctif injecté, aucune modification de `verify-release.js`, aucun Base64 serveur ni cache d’images ajouté.
- Aucun fichier de maintenance, audit temporaire ou migration ponctuelle dans `.github`. Le workflow navigateur est conservé comme contrôle permanent : plus de checkout forcé sur une ancienne branche ; il contrôle le commit testé sur push et PR vers main et exécute les quatre commandes de validation.
- Les 16 catalogues totalisent exactement 94 130 entrées. Contrôle strict dans la suite Node et comptage navigateur conforme au tableau ci-dessous.
- Comparaison intégrale des 16 211 objets Gessi avec main : seuls `productType` (16 211 ajouts) et `category` (1 383 changements) diffèrent. Tous les autres champs sont identiques, notamment références, collections, finitions, prix et médias. Le catalogue n’a pas été réécrit pendant cette finalisation.
- Navigateur : pagination 48 cartes, Resigres, Sira dans les 5 familles avec changement de pigment et persistance, corps ALPI avec quantité/suppression, parcours Gessi Anello → Lavabo → Type → références, visibilité dossier indépendante du devis, devis Pièce → Espace → Articles, images PDF valides/cassées ; zéro erreur JavaScript.
- Excel reste la fonction existante alimentée par `quoteRows()` et conserve les 16 colonnes, dont les coûts et marges. Corps natifs et exception Lefroy préservés. Moodboard non réactivé.

| Catalogue | Entrées |
|---|---:|
| Amphora | 171 |
| Coalbrook | 1 483 |
| ALPI | 3 041 |
| Catalano | 1 430 |
| Nicolazzi | 36 303 |
| Hotbath | 2 554 |
| Lefroy Brooks | 3 397 |
| Gessi | 16 211 |
| Ritmonio | 16 082 |
| Recor | 192 distinctes |
| Resigres | 38 parents |
| Fioranese | 1 135 |
| Vismaravetro | 15 |
| TDA | 20 |
| Sira Concrete | 5 familles / 26 modèles |
| Zucchetti | 12 053 |

## CORRIGÉ

Correctifs déjà présents et conservés :

- Sira : variation officielle exacte lorsqu’elle est disponible ; sinon image générique officielle du modèle avec `finishMatch: generic` et mention « pigment non garanti ».
- Hotbath : conservation du chemin fabricant, doubles `/` compris.
- Devis : organisation par pièce et espace ; corps liés dans l’espace du parent ; Excel restauré et conservé.
- Gessi : filtre Type, classement fonctionnel, volumes et données tarifaires préservés.
- PDF : préparation des images et blocage avant impression en cas d’échec.

Finalisation de cette passe :

- Version `11.57.0` dans `package.json` et les deux champs racines du verrou npm. Les API, UI, manifests et service worker utilisent déjà cette source unique ; aucun remplacement global.
- Défaut source PDF démontré par deux nouveaux tests rouges avant correction : un rejet ou un blocage de `decode()` était ignoré par `catch{}` et les dimensions positives suffisaient à accepter l’image. Correction dans `waitForDocumentImages()` : décodage en erreur refusé, timers nettoyés, délai borné, chargement eager. Les sept tests comportementaux PDF passent ensuite.
- Suppression d’une deuxième déclaration strictement identique de `requestServerSearch()`, issue de la restauration précédente ; comportement conservé.
- Test navigateur objectivement incorrect corrigé : après masquage, `selectedProductsForDocument()` était appelé sans `roomId` et retournait toujours une liste vide. Il reçoit désormais la pièce de l’article, comme dans le contrôle initial. Aucune assertion fonctionnelle retirée.
- Paramètre facultatif `CHROMIUM_PATH` dans la deuxième suite pour utiliser le navigateur disponible localement ; GitHub continue à utiliser son Chromium Playwright.
- Vérification de syntaxe étendue aux suites V11.57 et PDF ; comptages catalogue désormais stricts pour les 16 fabricants.

## TESTS

Exécutés sur les sources finales, localement :

| Commande | Résultat |
|---|---|
| `npm run check` | PASS, 21 fichiers JavaScript |
| `npm test` | PASS, 31 tests, 0 échec |
| `npm run build` | PASS, vérification release et 31 tests |
| `npm run test:browser` | PASS, 28 + 17 = 45 contrôles, 0 erreur JavaScript |

Le navigateur local utilise les réponses fabricant enregistrées et les images officielles téléchargées pour la première suite ; la seconde couvre l’interface et la préparation PDF. Ces résultats ne certifient pas l’accès réseau de tous les fabricants depuis Render. La CI permanente rejoue les quatre commandes sur le commit publié ; son résultat est indiqué dans la PR avant fusion.

## NON VÉRIFIÉ / DÉPLOIEMENT

État réel **avant fusion**, relevé le 5 octobre 2026 à 08:24 UTC : Render répond `11.56.1`, health OK / PostgreSQL, RSS 88,2 Mo / heap 19,5 Mo. Ce relevé n’est pas une validation de 11.57.0.

Après fusion, contrôler `/api/version`, `/api/health`, `/api/health/memory` et `/api/sira-assets?modelCode=OA1&color=PW`. La PR porte le résultat post-déploiement horodaté, le SHA de fusion et les réponses réelles. Ne déclarer le fallback corrigé en production qu’après réponse 200 avec visuel officiel exact ou générique.

Non couverts par cette passe : charge mémoire longue sur Render, tous les pigments de tous les fabricants en réseau réel, ouverture Excel desktop, dialogue d’impression système et audit visuel exhaustif des PDF. La cause réseau précise de l’ancien 502 Sira n’est pas établie ; le fallback corrige la perte totale de visuel sans prétendre réparer le réseau fabricant.

Confiance : élevée sur les contrôles locaux indiqués ; production à qualifier uniquement d’après les contrôles consignés dans la PR.
