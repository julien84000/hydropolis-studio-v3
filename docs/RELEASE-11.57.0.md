# Hydropolis Studio V11.57.0 — validation de release

Statut : **candidate de release — validation navigateur en cours**.

Cette version consolide les correctifs issus de l’audit V11.56.1 sans modifier les volumes de catalogues attendus.

## Correctifs inclus

- **Sira Concrete** : le résolveur conserve l’extraction officielle par pigment lorsqu’elle répond et utilise, en cas d’indisponibilité du site fabricant, le visuel générique officiel du modèle `siraconcrete.com` avec indication explicite que le pigment n’est pas garanti.
- **PDF client** : l’export n’interprète plus une image en erreur comme une image chargée. La préparation vérifie `naturalWidth`, attend le décodage dans un délai borné et bloque l’impression si un visuel requis reste en échec.
- **Hotbath** : les URL d’assets officielles sont conservées exactement telles que publiées par Hotbath, y compris les chemins pouvant contenir un double slash valide.
- **Devis** : hiérarchie `Pièce → Espace → Articles`, avec les espaces Lavabo, Douche, Bain, WC et Autres. Les corps d’encastrement restent des lignes d’article et suivent l’espace de leur produit parent.
- **Gessi** : restauration d’une hiérarchie fonctionnelle `Collection → Catégorie → Type → Référence → Finition`. Les lignes anciennement classées `Accessoires` ne sont reclassées que lorsqu’un usage produit explicite est identifié dans les descriptions tarifaires. Les 16 211 variantes Gessi, références, finitions, prix et médias sont conservés.
- **Excel / chiffrage** : restauration de l’export `.xls` après détection d’une suppression accidentelle pendant la consolidation V11.57. L’export continue à dériver de `quoteRows()` et conserve les colonnes de coût et marge.

## Validations déjà passées sur la branche

- `npm run check`
- tests Node consolidés et régressions V11.57
- `npm run build`
- migration Gessi validée à volume constant : 16 211 variantes
- catalogue Gessi Anello : catégorie Lavabo et niveau Type présents dans les données

## Validation restante avant fusion

- passe navigateur consolidée sur le commit final de candidate
- bump de version package vers `11.57.0`
- comparaison finale avec `main`
- fusion puis contrôle Render (`/api/version`, `/api/health`, `/api/health/memory`, Sira)

Aucun déploiement production n’est déclaré tant que ces étapes ne sont pas terminées.

- Restauration des fonctions dashboard/catalogue de V11.56.1 validée par `npm run build` avant la passe navigateur finale.
