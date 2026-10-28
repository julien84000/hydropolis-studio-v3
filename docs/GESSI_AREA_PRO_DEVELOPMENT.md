## État actuel — 28 octobre 2026 — 11.63.9

**Consigne actuelle de Julien : fiches techniques uniquement. Ne pas développer d’intégration BIM ni CAO.** Les mentions BIM/CAO ci-dessous décrivent les recherches historiques et ne sont plus le périmètre demandé.

PR #44 fusionnée dans main : db9df190f28c2806dcc7e2be88cc4b27182ca4bb. Commit de release : 592712208eccbc096bc689a5caae3542a52bc4ce. CI complète réussie : run 40776763802 (124 tests, syntaxe et parcours navigateur desktop/mobile, régressions existantes). Version applicative 11.63.9. Déploiement Render déclenché par la fusion ; sa version servie doit encore être confirmée, le dernier contrôle à 22:04 UTC renvoyant 11.63.8 / PostgreSQL OK.

Livré dans le code fusionné : menu officiel FR (9 univers, 79 entrées), photographies de collections, grille visuelle des finitions, objets/prix des 16 211 références conservés, consultation fabricant des collections non tarifées, navigation clavier et cache du menu.

Reste : fiches techniques exactes par article, navigation des sous-séries, import vérifié des articles non tarifés. L’API GetProductAttachments interrogée sur les dix modèles des fixtures ne renvoie que BIM ou aucune pièce jointe : aucun de ces liens ne doit être présenté comme une fiche technique PDF. Rechercher la source officielle PDF et vérifier la référence dans le document avant association.

**Prompt de reprise :** Reprends Hydropolis Studio depuis le dernier main, après PR #44 / release 11.63.9. Vérifie PR/CI récentes et Render /api/version + /api/health ; lis ce journal et docs/GESSI_AREA_PRO_DEVELOPMENT.md. Poursuis uniquement les fiches techniques Gessi (pas BIM/CAO), puis les sous-séries et articles officiels non tarifés. Préserve les tarifs, les autres marques et la PR Bette #43. Sauvegarde fréquemment sur GitHub et fournis un prompt à chaque checkpoint.

---

# Gessi Area Pro — reprise V11.64.0

## Sauvegarde 1 — sources officielles (28 octobre 2026)
Base : main acd5bf3 (PR #42), application 11.63.8. PR #41 Gessi visuel et #42 classement multi-univers déjà fusionnées ; CI de #42 réussie. Render /api/version et /api/health ont confirmé 11.63.8 et PostgreSQL. PR #43 Bette ouverte : ne pas écraser son travail.

Branche : feat/gessi-official-resources-1164.

Terminé et sauvegardé :
- Lecture du vrai bundle Area Pro public et identification de ses endpoints publics.
- Capture du menu FR : 9 univers, 79 entrées univers/collection, images officielles et sous-séries (certains noms sont partagés entre univers).
- Import reproductible scripts/import-gessi-menu.js vers public/gessi-area-pro-menu.json, sans prix ni références inventés.
- Captures officielles de l'article 66134 et de ses ressources : finitions, images exactes, dimensions, lien BIMObject provenant de Gessi.
- Aucun fichier du catalogue tarifaire ni donnée client modifié. Pas encore de changement de l'interface ou de déploiement dans ce checkpoint.

À faire : intégrer les grandes images officielles de collections ; permettre la consultation des collections non tarifées ; utiliser les listes publiques Gessi pour les modèles et sous-séries ; charger les photos par finition et documents exacts à la demande ; préserver strictement les 16 211 lignes tarifaires et corps techniques ; rendre les finitions visuelles ; tester desktop/mobile et les autres marques.

## Prompt de reprise
Reprends Hydropolis Studio sur la branche feat/gessi-official-resources-1164. Lis docs/GESSI_AREA_PRO_DEVELOPMENT.md puis docs/REPRISE_CHATGPT.md, les dernières PR et main. Préserve les PR #41/#42 Gessi et la PR Bette #43 ou ses successeurs. Les sources officielles du menu Gessi (9 univers, 79 entrées) sont sauvegardées, mais leur nouvelle intégration UI n'est pas encore réalisée. Continue réellement le configurateur visuel, références/finition/documents exacts et prix issus uniquement du tarif existant. Fais des checkpoints GitHub fréquents, ajoute les tests et vérifie CI, fusion puis Render avant d'annoncer un déploiement. Actualise ce document après chaque étape.

## Sauvegarde 2 — interface visuelle et validations

Base toujours main acd5bf3, version 11.63.8 (aucune nouvelle version déployée).

Réalisé :
- Le menu public officiel alimente désormais l'explorateur : 9 univers et 79 entrées, dont 18 collections Bathroom. Grandes photographies officielles de collections ; repli sur l'ancien menu si le nouveau fichier est indisponible.
- Les collections sans tarif sont consultables et renvoient au fabricant ; aucune référence ni aucun prix ajouté artificiellement.
- Le choix de finition utilise des boutons illustrés (photo exacte vérifiée ou nuancier), avec référence exacte, état sélectionné et une seule image principale.
- Clavier : confinement du focus dans la fenêtre, fermeture Échap, retour au bouton d'ouverture.
- 124 tests automatisés réussis via npm run build, y compris conservation des 16 211 objets tarifaires exactement une fois et des prix, provenance des 79 entrées et des images. Six tests Gessi historiques inchangés réussis.
- Nouveau tests/gessi-visual-browser.js pour desktop/mobile, choix de finition, ajout de l'objet tarifaire original, collections non tarifées et clavier ; ajouté à npm run test:browser. NON exécuté localement : téléchargement Chromium Playwright invalide. La CI doit le confirmer avant fusion.

Partiel : les sous-séries sont conservées dans les données mais pas encore navigables. Les listes d'articles officiels non tarifés, les nouvelles photos par finition et les documents techniques/BIM dynamiques ne sont pas encore intégrés. Les captures 66134 sont disponibles pour ces développements.

Reprise courte : reprendre feat/gessi-official-resources-1164 ; lire ce document et docs/REPRISE_CHATGPT.md ; vérifier la PR de cette branche et la CI, puis le dernier main et PR Bette #43. Terminer/valider le test navigateur avant fusion. Continuer le chargement des articles et sous-séries officiels ainsi que leurs documents, sans modifier les tarifs existants. Faire des commits fréquents. Ne pas annoncer de déploiement sans vérification /api/version et /api/health.

## Repères techniques pour la suite (sources publiques observées)

PR de sauvegarde : https://github.com/julien84000/hydropolis-studio-v3/pull/44 ; interface sauvegardée dans e7b5235aef663789f93957886fd2c15c3c82be3b.

Le bundle officiel Area Pro `main.f95a8e91457564e7.js` utilise la base `https://g-ecatalogue-be-prod-we.azurewebsites.net` :
- `/public/menu/get?country=FR&language=fr` : capture complète dans tests/fixtures/gessi-areapro/menu-fr.json.
- `/public/product/GetProductList?country=FR&language=fr&collection=<collectionId>&ambient=<ambientId>&page=1`, avec `serie=<serieId>` pour une sous-série. Les ID exacts sont dans public/gessi-area-pro-menu.json. Réponse : data.products, data.nextPageToken, data.totCount. Le site transmet le jeton suivant par l'en-tête `X-Continuation-Token-Cosmos` ; ne pas tronquer silencieusement les résultats.
- `/public/product/GetProductDetails?country=FR&language=fr&productCode=66134` : capture dans product-66134.json. data.product.productsConfigured contient finitureId, configuredCode, version et specificFeatureProductImg. Ne pas confondre un code commercial modèle/finition avec configuredCode, ni sélectionner arbitrairement entre plusieurs versions partageant une finition.
- `/public/product/GetProductAttachments?country=FR&language=fr&productCode=66134` : capture attachments-66134.json. Pour cet article, lien BIMObject officiel présent ; ne pas inventer un PDF technique absent.

Dimensions : lire product.technical, jamais packageHeight/Width/Length (emballage). Images officielles de collections sur gwebassets.gessi.com ; photographies produit/finition sur gessistorage.blob.core.windows.net ; nuanciers sur gessistorage.azureedge.net. Les tarifs priceInfo des captures sont null : préserver le tarif Hydropolis comme seule autorité de prix.

Intégration recommandée : route serveur à URL fabricant fixe, validation des ID contre le menu, timeout, taille et cache bornés ; chargement à la demande pour éviter de ralentir les autres marques. L'ajout existant passe volontairement l'objet tarifaire original à onAdd(p). Vérifier aussi le lanceur manufacturer-guide/app.js avant de vouloir propager de nouveaux documents au projet : son callback résout aujourd'hui la référence dans le catalogue.

CI run 40776014311 : tests métier et navigateur existants réussis ; le nouveau parcours Gessi passe desktop/mobile jusqu'à l'assertion du texte français non tarifé. Échec identifié dans la page de test synthétique sans charset UTF-8 (texte interprété en Latin-1), pas dans l'application réelle. Page de test corrigée avec content-type UTF-8 et meta charset ; relancer la CI. Aucun test supprimé ou assoupli.

## Préparation du déploiement 11.63.9 — PR #44

CI complète réussie sur e2237f0 (run 40776321617), y compris parcours navigateur Gessi desktop/mobile et régressions existantes. Version portée à 11.63.9 pour renouveler les caches ; menu officiel ajouté au shell hors connexion. Nouvelle CI requise sur ce commit de version avant fusion. Déploiement demandé explicitement par Julien ; pas encore vérifié en production à ce stade. Les sous-séries et documents/BIM dynamiques restent à développer.


## Checkpoint — Gessi V11.64.0 (travail repris après quota Work)

- Base : main deb83ee86cca5b37ad30b3df8eb95346f78b8cf6 / version 11.63.9, PR #44 fusionnée ; Render 11.63.9 et PostgreSQL OK vérifiés le 28/10/2026.
- Branche : feat/gessi-technical-sheets-11640. Nouvelle route serveur GET /api/gessi/technical/:code pour récupérer les **caractéristiques techniques officielles du produit** avec un code Gessi exactement à cinq chiffres ; URL fournisseur fixe, validation de l'identité, timeout, limite de taille, cache mémoire limité, erreurs explicites.
- Explorateur : panneau « Fiche technique du produit » directement dans l'étape finale de configuration, après la sélection modèle/finition. Lecture à la demande ; une panne du fabricant ne bloque ni les prix, ni l'ajout au projet. Les dimensions affichées proviennent du champ product.technical, jamais des dimensions d'emballage.
- IMPORTANT **pas de BIM/CAO**. L'API publique GetProductAttachments observée pour 59003 et 66134 ne donne que des objets BIM ; elle ne permet pas d'établir un lien PDF technique fiable. Le panneau ne prétend donc pas offrir un PDF et ne lie pas une mauvaise fiche à un SKU. Lien vers la fiche officielle Gessi où le fabricant propose, selon l'article, un téléchargement PDF.
- Version package + lock 11.64.0 et tests Node + navigateur Gessi. Aucun changement aux 16 211 articles tarifés Gessi ni aux autres marques, tarifs, remises ou projets.
- **Validation CI, PR et Render en attente** tant que GitHub Actions n'a pas terminé. Ne jamais annoncer 11.64.0 en production sans vérifier /api/version et /api/health.
- **Suite** : accéder aux vrais PDF techniques via une source officielle vérifiable référence par référence (ne pas confondre notices de pose et fiches), puis rattacher les sous-séries à une liste de vrais produits officiels sans affectation arbitraire de références tarifées. Préserver PR #43 Bette (brouillon).
