# Hydropolis Studio V11.45 — consolidation

Cette archive est un **overlay de consolidation** à appliquer à la racine du dépôt `hydropolis-studio-v3`.
Elle ne remplace pas le dépôt complet : elle contient le consolidateur V11.45, les nouveaux catalogues, l'interface Resigres et les tests V11.45.

## Ce que fait le consolidateur

1. applique une seule fois les scripts historiques V11.42, V11.43 et V11.44 s'ils ne sont pas déjà intégrés ;
2. vérifie leurs marqueurs avant de continuer ;
3. supprime l'exécution d'un patch au démarrage et remet `npm start` sur `node server.js` ;
4. charge Fioranese 2025 et Resigres 2026 dans les manifests ;
5. installe la logique Fioranese de conversion m² → nombre entier de boîtes → m² réellement commandés ;
6. installe le configurateur Resigres avec conservation des choix et des pages tarifaires sources ;
7. autorise la recherche de visuels sur `fioranese.it` et `resigres.com` ;
8. conserve les fonctions V11.42–V11.44 : quantités, devis éditable et mise en page client déplaçable/redimensionnable.

## Installation sur une copie de travail / branche Git

Copier le contenu de ce dossier à la racine du dépôt, puis exécuter :

```bash
node apply-v11.45-consolidated.js
npm run build
npm start
```

Le consolidateur est idempotent sur une base déjà consolidée : il vérifie les marqueurs V11.42/V11.43/V11.44 et ne relance pas inutilement les anciens scripts.

## Fioranese

Le catalogue V11.45 contient actuellement **1 135 entrées**, dont **1 132 lignes structurées vérifiées** et **3 accès PDF volontairement non chiffrés** lorsque le texte extrait ne permet pas d'associer un prix à une variante sans ambiguïté.

Pour les articles tarifés au m² et conditionnés en boîte :

```text
boîtes = plafond(m² demandés / m² par boîte)
m² commandés = boîtes × m² par boîte
montant = m² commandés × prix / m²
```

Exemple : 1,47 m² demandés, boîte de 1,46 m² → 2 boîtes → 2,92 m² commandés.

Les articles tarifés à la pièce ou à la composition ne passent pas par cette règle. Les informations de conditionnement Fioranese sont conservées par référence. Le tarif fabricant précise que les données d'emballage/palettisation sont indicatives et peuvent évoluer : une vérification fournisseur reste nécessaire avant commande.

Les trois familles laissées en accès PDF sont : `Fio. Brick`, `Fio. Glossy Brick` et `Fio. Passepartout`. Cette décision évite d'affecter automatiquement un prix à la mauvaise finition/colonne.

## Resigres

Resigres est intégré comme **configurateur**, et non comme simple liste de références, car le prix dépend du modèle, des dimensions, des matières/finitions, des couleurs et d'options.

Le configurateur couvre les 38 familles/pages du tarif 2026 : receveurs, plans de vasque, plans pour meuble, vasques, baignoires, meubles, miroirs et compléments. Les choix de configuration sont enregistrés dans l'article ajouté au projet.

Les règles clairement lisibles sont automatisées. Exemple Vento page 6 : RAL/NCS +95 € et rainure de paroi de douche 0,55 €/cm. **Les prix de base issus de matrices dont les colonnes sont ambiguës restent à saisir depuis la page PDF affichée.** Aucune valeur incertaine n'est transformée en prix automatique.

## Tests inclus

```bash
node tests/v11.45-pricing.js
node tests/v11.45-catalog-data.js
node tests/v11.45-consolidation-static.js
```

Après application au dépôt réel, `npm run build` exécute les contrôles de syntaxe puis les tests historiques existants et les tests V11.45.

## Limite de cette livraison

L'intégration GitHub disponible dans la session n'avait pas les droits d'écriture (`403 Resource not accessible by integration`). La V11.45 n'a donc **pas été commitée ni poussée** dans `main` ou dans une branche distante. Les contrôles V11.45 ont été exécutés sur un dépôt synthétique reproduisant la structure attendue, mais le build complet du dépôt réel doit encore être exécuté après application de l'overlay.
