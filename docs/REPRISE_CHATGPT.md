# Reprise Hydropolis — 28 octobre 2026

Base auditée : main 9912c7f2860f4aaeb3450c0c90dca58d22312535, application 11.62.11. PR Resigres #26 à #32 fusionnées. Conserver intégralement ces correctifs ; voir docs/RESIGRES_2026_TARIFF_AUDIT.md et docs/RESIGRES_2026_38_GROUP_STATUS.json pour les limites tarifaires.

## État du chantier antérieur
L'environnement temporaire a été nettoyé. La branche locale feat/v11.63-sbordoni-documents et son commit local 4491ba1 ne figurent pas parmi les branches distantes. Les transferts de blobs antérieurs ne constituent pas une livraison. Les 64 tests annoncés concernaient cette ancienne copie et doivent être réexécutés après reconstruction.

## Reprise en cours
Les 98 PDF individuels Sbordoni et les planches HD/4K ont été retrouvés dans les fichiers persistants. Reconstruction sur la base Resigres actuelle, avec sauvegardes sur cette branche au fur et à mesure. Ne pas fusionner ce point de sauvegarde comme livraison fonctionnelle.

## Ordre de travail
1. Restaurer et versionner les 98 fiches PDF, leurs empreintes et les associations vérifiées ; protéger les documents personnalisés.
2. Restaurer les 99 images HD et leur provenance ; vérifier visuellement les recadrages et renouveler le cache.
3. Tester toutes les migrations et les parcours Resigres existants ; diagnostiquer le précédent échec navigateur Hotbath CB003C.
4. Reprendre les audits Hidrobox (+4 % une seule fois, remise 50 %), Bette (62 264 variantes, remise 50 %) et Carrodrain (14 modèles, remise 50 %). Conserver la taxonomie Hotbath officielle et enrichir Zucchetti/Lefroy Brooks.
5. Fusion et contrôle Render seulement après validation. Distinguer préparé, sauvegardé, testé, fusionné et déployé.

## Pour ChatGPT classique
Lire ce fichier, le journal Resigres et le diff de la branche. Vérifier main et les PR récentes avant de reprendre. Les chemins /workspace de l'ancienne conversation ne sont pas une sauvegarde durable. Les fichiers tarifaires sources sont HIDROBOX_TARIF_FR_V0226_19-02-2026.pdf, CD.L2027.pdf et TARIF BETTE.csv. Ne pas inventer les prix manquants.

## Point sauvegardé : fiches techniques reconstruites
- Les 98 PDF et leur index sont sauvegardés par cinq commits sur cette branche ; dernier lot : 3a1b018b26ed44abaa6c5c5d0aeb8981d36c03bb.
- Module public/sbordoni-documents.js : recherche par référence, dialogue accessible, association stricte des supports/cuvettes, protection des documents personnalisés, migration idempotente.
- Intégration dans app.js, index.html et service worker ; aucune modification des règles Resigres.
- Validation locale reconstruite : npm run build, **85 tests réussis**, dont les tests Resigres et trois tests nouveaux (98 empreintes, associations et migration). La base avant modifications passait 82 tests.
- Tests navigateur de la bibliothèque ajoutés à tests/browser-consolidated.js, mais **pas encore exécutés sur cette reprise**. Attendre la CI de la PR et examiner ses résultats.
- **Images HD non encore réintégrées** : les 99 anciennes améliorations ne sont pas présentes dans cette branche. Les sources Sbordoni_planches_HD.pdf, Sbordoni_planches_4K(1).pdf et Sbordoni_planches_4K.pdf ont été récupérées ; elles sont disponibles parmi les fichiers persistants de Julien.
- La version applicative reste 11.62.11 pendant cette étape brouillon : choisir/incrémenter la version avant livraison pour renouveler le cache.
- Rien de cette reprise n'a été fusionné ou déployé.

## Prompt à copier dans ChatGPT classique
Reprends Hydropolis Studio sur https://github.com/julien84000/hydropolis-studio-v3. Lis d'abord docs/REPRISE_CHATGPT.md sur la branche work/sbordoni-after-resigres-116211, puis son diff et les PR récentes. Préserve tous les correctifs Resigres jusqu'à 11.62.11 et tout développement ultérieur. Les 98 PDF Sbordoni, leur index, la recherche et les associations ont été reconstruits et sauvegardés ; 85 tests unitaires/build passent. Vérifie la CI navigateur, réintègre les 99 images HD avec leur provenance et contrôle les configurations enregistrées. L'ancien commit local 4491ba1 n'est pas une sauvegarde distante exploitable. Poursuis ensuite les chantiers Hidrobox, Bette, Carrodrain, Zucchetti et Lefroy Brooks décrits ci-dessus, sans perdre la taxonomie Hotbath. Enregistre chaque étape sur GitHub et actualise ce journal. N'annonce une livraison qu'après tests, fusion et vérification effective de Render. Si tes outils ne permettent pas une opération, indique précisément le blocage plutôt que d'affirmer qu'elle est faite.

## Checkpoint Sbordoni V11.63.0 — images HD restaurées (28/10/2026)

**Cette section actualise et remplace l'état « images HD non encore réintégrées » décrit plus haut**, qui correspondait au premier checkpoint de la PR #33.

- Les **99 images de compositions** ont été régénérées depuis le catalogue officiel `https://www.sbordoniceramica.com/download/Cat_SBORDONI.pdf`. Son SHA-256 vérifié correspond au manifeste de provenance conservé : `d0eb7aac8feb11888f3c50d78d580d3508dbd3d9f1dcbefc795d31c71d95645f`.
- `scripts/extract-sbordoni-compositions.py` utilise maintenant la position réelle du XRef sur la page PDF (rendu à 3 pixels par point) pour conserver **les inversions horizontales**, les pieds, les piétements et les recadrages voulus. 93 XRefs et 6 zones de page dans `provenance.json`.
- Les légendes vectorielles `art. ...` parasites sont masquées dans leur boîte de texte, sans masquer toute la largeur de la composition. **21 images** avaient des masques de légendes ; contrôle ciblé du `5700-G571` : image 440 × 422 pixels, deux pieds complets, légende supprimée.
- L'ensemble des 99 JPEGs et `public/sbordoni/compositions/hd-manifest.json` (dimensions, page, XRef, transformation, SHA-256, taille, masques) est maintenant **commité sur cette branche distante**. Commit généré par GitHub Actions `818efa3313215cc1467d8a26e3a08642564b5849` puis nouvelle extraction avec légendes nettoyées `0e0112b4428277e88f3766871da70fdbaa569173`.
- Workflow reproductible `.github/workflows/sbordoni-hd-rebuild.yml` : téléchargement du catalogue, contrôle SHA avant toute écriture, extraction des 99 images, rapport et contact sheet en artefact GitHub, `npm ci/check/test/build`, commit des images sur la branche *uniquement en cas de succès*. Aucun téléchargement du PDF fournisseur n'est nécessaire pour le fonctionnement de l'application déployée.
- Nouveaux tests dans `tests/sbordoni-hd-assets.test.js` : 99 empreintes JPEG exactes, dimensions, provenance, miroir et masque de `5700-G571`. Les tests Chromium de `tests/browser-consolidated.js` vérifient également le vrai chargement HTTP du JPEG HD et du manifeste, en plus des PDF techniques.
- **Version préparée : 11.63.0** (`package.json` et lockfile) pour renouveler la version et les caches de l'application. Conserver `public/sbordoni-model.js` et ses associations exactes aux 99 noms canoniques.
- Ce sont des **rendus de meilleure résolution du PDF fournisseur**, pas une création de détails photographiques 4K absents du PDF original. Ne pas assimiler la taille affichée 440 × 422 pixels à une photographie 4K native.
- Les 98 PDF techniques, l'index, la recherche, la protection des documents personnalisés, les corrections Resigres V11.62.11, la taxonomie Hotbath et les autres marques restent intacts.
- **À vérifier avant fusion** : nouvelle CI après ajout des tests HD (test, build, Chromium), compatibilité des anciennes configurations, et comparaison des recadrages dans l'artefact `sbordoni-hd-99-contact-sheet`. L'application en production n'a pas encore été modifiée par la PR #33.

### Suite prévue
Reprendre les audits Hidrobox/Bette/Carrodrain puis Zucchetti et Lefroy Brooks, sans supprimer les prix ou les visuels officiels Hotbath. Les remises, grilles tarifaires et configurations enregistrées doivent être comparées aux sources. Mettre ce journal à jour après chaque validation.

## Livraison V11.63.0 confirmée — 28 octobre 2026

- **PR #33 fusionnée** : https://github.com/julien84000/hydropolis-studio-v3/pull/33, commit de fusion `a33170f25787e258838184db41e5039b54786a88`. La branche conserve tous les changements de `main` jusqu'aux correctifs Resigres V11.62.11.
- **CI de branche sur dernier commit** : https://github.com/julien84000/hydropolis-studio-v3/actions/runs/40712272924 — `npm ci`, `npm run check`, `npm test` (y compris les nouveaux tests des 99 JPEG), `npm run build`, et `npm run test:browser` sous Chromium : **success**.
- **CI du commit fusionné sur main** : https://github.com/julien84000/hydropolis-studio-v3/actions/runs/40712643910 — **success**, y compris Chromium.
- **Render vérifié en ligne** : `GET /api/version` → `11.63.0` ; `GET /api/health` → `ok: true`, `version: 11.63.0`, `database: postgresql`.
- **Actifs publics** : `GET /sbordoni/compositions/hd-manifest.json` sert `count: 99` et le SHA source vérifié du catalogue. La lecture directe du JPEG 5700-G571 par un extracteur de contenu web renvoie `empty_content` (binaire image, pas du texte) ; son vrai chargement, son format et ses dimensions ont été vérifiés en test navigateur CI. Ne pas présenter la réponse `empty_content` comme une panne d'image.
- **Visuels de contrôle** : contact sheet HD de 99 compositions sauvegardée comme artefact du workflow GitHub Sbordoni : https://github.com/julien84000/hydropolis-studio-v3/actions/runs/40711445496. 21 légendes vectorielles supprimées, dont la référence 5700+G571 ; positions et empreintes dans `hd-manifest.json`.
- **Terminé** : 98 PDF techniques, associations strictes, recherche et migration non destructrice, 99 compositions visuelles haute résolution reconstruite et auditée, nouvelle version 11.63.0 et déploiement vérifié.
- **Non terminé / à poursuivre** : qualification commerciale de toutes les variantes Sbordoni (notamment photos réellement natives 4K inexistantes si le PDF ne les fournit pas), audits Hidrobox, Bette, Carrodrain, Zucchetti, Lefroy Brooks ; préserver les 12 collections / 53 catégories Hotbath et les tarifs Resigres.
- Les tests navigateur ont été réalisés sur la base CI isolée, pas sur des projets personnels déjà enregistrés en production. Aucune migration de projets utilisateurs existants n'a été réalisée ou déclarée comme testée en production.

## Checkpoint V11.63.1 — matrices Bette / Hidrobox / Carrodrain (28 octobre 2026)

Branche de travail : `feat/v11.63.1-brands-pricing-integrity`. PR : https://github.com/julien84000/hydropolis-studio-v3/pull/34. Base main `b292df48fd5e5e8e412c0f4506a009f5327fbc96` (V11.63.0, Sbordoni intégré).

- `scripts/audit-brand-pricing.js` charge réellement les fichiers Bette/Hidrobox/Carrodrain en gzip Base64 et vérifie toutes les 67 378 variantes : Bette 62 264 / 93 groupes, Hidrobox 4 479 / 27 groupes, Carrodrain 635 / 12 groupes. **Zéro prix vide/invalide, zéro référence manquante, zéro doublon exact.** Les 4 479 prix Hidrobox suivent strictement la hausse de 4 % arrondie aux centimes ; la remise achat à 50 % reste distincte.
- Nouvelle vérification **au moment de l'enregistrement** des configurations : prix public HT positif exigé ; Hidrobox exige une ligne de prix brute et son montant majoré correct, sans seconde majoration.
- Bette et Carrodrain rouvrent la **référence exacte** d'un article si elle est présente, y compris lorsque l'ancien `configGroup` est devenu périmé. Carrodrain n'efface pas la sélection en recliquant sur la même famille.
- Bette peut conserver une image représentative de collection avec `imageFinishMatch: 'collection'` au lieu de laisser une vignette vide ou de déclarer l'image comme exacte.
- Tests de régression ajoutés à `tests/v11.63.1-brand-pricing.test.js`, disponibles dans `npm test`. Le rapport technique est dans `docs/BRAND_PRICING_AUDIT_V11.63.1.md`.
- **Limites des preuves** : ce contrôle confirme l'intégrité des **fichiers importés**, pas leur exhaustivité face aux PDF constructeur ; les images des variantes et la vérification source par page restent à poursuivre. Aucune des anciennes règles Resigres, des ressources Sbordoni ni des catégories Hotbath n'a été modifiée.
- **À la reprise** : lire la PR #34, son dernier SHA, CI Chromium et le journal technique ; distinguer « branche sauvegardée », « tests réussis », « fusion » et « Render ». Poursuivre la couverture photographique et documentaire Bette / Carrodrain, les collections Hidrobox, puis Zucchetti et Lefroy Brooks. Ne pas remplir des prix absents par estimation.

## Livraison V11.63.1 vérifiée — 28 octobre 2026

- **PR #34 fusionnée** : https://github.com/julien84000/hydropolis-studio-v3/pull/34 ; commit de livraison `d876107246a8b8f55d9061e31cac7c4e2eed6d0b`.
- **CI sur la branche** : https://github.com/julien84000/hydropolis-studio-v3/actions/runs/40740598388 — tests unitaires, build et Chromium : succès.
- **CI après fusion** : https://github.com/julien84000/hydropolis-studio-v3/actions/runs/40741003908 — tests unitaires, build et Chromium réalisés avec succès.
- **Render en ligne** : `GET /api/version` = `11.63.1`, `GET /api/health` = `ok: true`, `version: 11.63.1`, `database: postgresql`. La version 11.63.0 relevée immédiatement après fusion était l'ancienne release pendant propagation.
- **Livré** : audit exhaustif interne des données Bette (62 264 lignes), Hidrobox (4 479 lignes) et Carrodrain (635 lignes), sans zéro, doublon exact ni référence vide dans ces fichiers. Toutes les lignes Hidrobox respectent l'augmentation de 4 % exactement une fois. Contrôle du prix à la sauvegarde et conservation des références exactes à la réouverture Bette/Carrodrain.
- **Carrodrain** : galerie 14 familles, **12 réellement tarifées** dans la matrice importée ; Invisible Disco et Kerlox sont proposés comme liens fournisseur, non tarifés automatiquement.
- **À poursuivre** : comparer ces données importées directement aux tarifs source sur toutes les références (cohérence interne ≠ exhaustivité), compléter les documents et visuels exacts Bette/Hidrobox/Carrodrain, puis Zucchetti et Lefroy Brooks. Préserver Resigres, Sbordoni et Hotbath.
- Rapport durable : `docs/BRAND_PRICING_AUDIT_V11.63.1.md`. Aucun projet utilisateur ancien n'a été manipulé en production lors de ces tests.

## V11.63.2 — Hotbath : photographies constructeur et grille par collection

**Point de départ** : `main` V11.63.1, commit `b788977875fb8c6fa1aaad87dce9cb18c34b18e0` ; préserve les audits Bette/Hidrobox/Carrodrain, Resigres V11.62.11, Sbordoni V11.63.0 et Hotbath prix d'origine.

- Audit initial des 53 catégories et de leurs 647 associations référence/catégorie : seules **264** avaient une photographie liée à une référence exacte dans l'ancienne taxonomie (les nombres sont comptés par catégorie, y compris références répétées entre catégories).
- Sources officielles consultées : grilles produits de `hotbath.com/en-gb/collections/` pour Gent, Archie, Chap, Cobber, Cobber X, Gal, Ace, Mate, Fellow, Tron ; la plupart des visuels déjà indexés proviennent de ces pages actuelles. Une nouvelle correspondance Archie AR096-20 a été ajoutée.
- **367 photos supplémentaires** trouvées dans les **53 grilles historiques officielles `hotbath.it/fr/prods/`**, uniquement lorsque le nom du fichier image photographique comporte **exactement** la référence modèle attendue pour la même collection et catégorie (après normalisation des points, tirets et accents). Aucune image approchante ou d'une autre collection n'est attribuée automatiquement.
- **Couverture : 631/647 associations (97,5 %)** d'après les métadonnées ; 16 restent sans photographie certifiée. Ne pas inventer d'image pour AR131/AR129 et les autres références manquantes ; ne pas remplacer le prix ou la finition par ceux d'un modèle voisin.
- Les URLs et leurs pages d'origine sont enregistrées sous `officialHistoricalSources` et `official2026Sources` dans `public/brand-guide-hotbath-media.json`. La grille affiche des photos de produit sur carré clair avec la référence sous l'image (style Hotbath) et un compteur photos/références. CSS strictement limité à `.mg-hotbath-official`.
- Les finitions continuent d'être sélectionnées uniquement sur les références tarifaires existantes, avec le prix du catalogue et les corps techniques éventuels. Les visuels de modèle ne sont **pas** présentés comme exacts pour toutes les finitions.
- Tests unitaires : audit de la couverture 631/647 et contrôle des 367 associations nom de fichier = modèle. Test Chromium : naviguer jusqu'à Archie AR003, vérifier que le JPEG fournisseur est réellement chargé et que la référence figure sous l'image. Les autres fabricants ne sont pas modifiés.

**Livraison** : PR à vérifier et CI complète à faire passer avant toute fusion ou contrôle de production. Aucun prix ni référence article n'a été inventé.


## Checkpoint Hotbath — normalisation des références du tarif (28/10/2026)

- Demande : utiliser **hotbath.it** comme source prioritaire des catégories et pages articles ; ne pas confondre le domaine source avec la disponibilité HTTP des vieilles URL photographiques. La fiche catégorie Archie présente bien AR003, mais son JPEG historique `/documents//ProdCateg/3522/AR003_1_2023.jpg` a renvoyé HTTP 404 lors du contrôle. Ne pas certifier une photo non disponible.
- Normalisation réellement enregistrée sur la branche de la PR #35 : `public/catalog_hotbath.json` compte toujours **2 554 références**. Suppression stricte du suffixe final `.IT` sur **2 546 références commerciales** et **188 références de corps techniques**, uniquement chez Hotbath. Exemple : `AC003.BBP.IT` devient `AC003.BBP`. Les 8 références qui ne portaient pas ce suffixe restent intactes.
- Les champs `sourceReference` et `sourceInternalReference` préservent les codes du tarif source pour audit ou rétrocompatibilité. Audit avant commit : **aucun doublon sur fabricant + référence canonique**, prix de base, prix total, supplément de corps, remise, collection, modèle et finition identiques aux valeurs antérieures.
- `public/catalog-index.js` accepte aussi l'ancien code `.IT` via un alias ciblé Hotbath, **sans créer de seconde ligne tarifaire**. Cela protège les clés d'anciens projets clients ; aucune donnée utilisateur de production n'a été migrée.
- Tests de régression : `tests/v11.63.2-hotbath-refs.test.js` contrôle le nombre de lignes, l'absence du suffixe, la provenance, l'unicité, les alias historiques, les prix et les corps techniques. Test ajouté au `npm test` de `package.json`.
- Commits confirmés : catalogue `08da94936db91b499ae035c25e1bde3d3530793d`, alias `b98e8cd0a2117214fc9ecfbc30fbd2f6a0c04f60`, tests `8d9c3ac9ce341ef379ab0c244444e2861764a8b8`, exécution CI `436c215d779a0cf5c2b0447ce3248f1d4a5c683d`.
- Les vérifications CI Node + Chromium du commit normalisé sont **en cours** à ce checkpoint : vérifier leur conclusion, corriger tout échec, puis fusionner la PR #35 uniquement si la révision finale est validée.
- Production Render : dernier contrôle direct des endpoints `/api/version` et `/api/health` : **11.63.1**, `ok: true`, PostgreSQL. La 11.63.2 n'est pas déclarée déployée.
- À poursuivre : contrôle navigateur des liens officiels `hotbath.it` et des visuels réellement décodables ; éviter les nouvelles correspondances inventées ; garder prix, finitions et corps techniques ; ensuite Hidrobox, Bette, Carrodrain, Zucchetti et Lefroy Brooks.


### Correctif d'association collections Hotbath — PR #35

- Le tarif source contient des lignes associées à plusieurs collections, par exemple `Ace / Fellow` et `Cobber / Mate`, ainsi que l'orthographe `Cobber-X`. L'ancien index de `public/hotbath-official-guide.js` exigeait `p.collection === nomOfficiel`, excluant silencieusement une partie des tarifs pourtant présents.
- L'index lit désormais tous les libellés séparés par `/`, normalise l'orthographe contre les **12 collections officielles connues** et référence **la même ligne tarifaire**, sans en créer de copie ni modifier prix, finition, code interne, ou collection d'origine. Les familles n'appartenant pas aux 12 catégories du navigateur (ex. Sparky) restent dans le catalogue source sans être attribuées à une collection inventée.
- Contrôle analytique du catalogue et des 647 références officielles : **385 modèles tarifés avant**, **611 modèles avec correspondance exacte après** (226 modèles supplémentaires, 36 modèles restant sans ligne tarifaire exacte). C'est une amélioration de liaison, **pas une importation de nouvelles références**. Les tests unitaires correspondants sont dans `tests/v11.63.2-hotbath-refs.test.js`.
- Commits sur PR #35 : index `3221378c05f0889fd74e925c1e9a9b178c92062c`, tests `e1afdf86baec170a1a9afe67a0909c981b9fbc99`, ajustement de la vraie référence Cobber X `CX003C` au lieu de `CX003` dans le test `50b7ac69ee11cd7137b50ac5f3a818a4f830d7e9`. Le test sur `e1afdf8` avait échoué sur la référence factice du contrôle ; ce cas est corrigé et nécessite la CI du dernier SHA.
- Continuité : le retrait du suffixe `.IT` et ses alias restent en place ; tests de sauvegarde des projets en production non exécutés ; la PR #35 n'est pas fusionnée et le déploiement Render reste à vérifier après une éventuelle fusion.


### Qualification des photographies Hotbath (rectification des métriques)

- Les **631/647** associations mentionnées au début de la PR #35 étaient un résultat de recherche de correspondances par nom de fichier sur les pages fournisseur, **pas une validation de disponibilité HTTP des images**. Ne pas reprendre ce chiffre comme couverture photographique réellement affichable.
- Le contrôle HTTP et décodage raster ultérieur a examiné les **367 archives historiques**, récupéré **158 URL CDN modernes** et constaté **209 URL sans variante CDN prouvée**. L'application affiche maintenant **422 modèles sur 647 avec une URL photographique compatible et vérifiée par ce processus**, et **225 sans photographie fiable**. Source durable : `docs/HOTBATH_CDN_AUDIT.json` et `public/brand-guide-hotbath-media.json`.
- Le fait qu'une fiche existe sur `hotbath.it` ne prouve pas que son JPEG `/documents/ProdCateg/...` existe encore (AR003 a répondu 404). La preuve photographique de la finition reste distincte du modèle et du prix exact.
- **Validation nécessaire** : dernière exécution complète de GitHub Actions, images réelles et navigation Chromium avant fusion ; la couverture 422/647 ne doit pas être présentée comme 97,5 %.
