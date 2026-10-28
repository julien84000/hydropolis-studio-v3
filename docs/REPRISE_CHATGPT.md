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
