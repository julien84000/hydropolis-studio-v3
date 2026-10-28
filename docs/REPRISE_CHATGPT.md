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
