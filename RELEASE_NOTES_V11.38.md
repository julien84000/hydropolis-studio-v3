# Hydropolis Studio V11.38

## Nicolazzi — visuel composite fiable

- La photo principale représente le modèle Nicolazzi et, lorsqu'elle existe, la finition demandée.
- Cette photo n'est plus présentée comme une preuve de la poignée choisie.
- La poignée exacte décodée depuis la référence et le catalogue PDF officiel apparaît dans une vignette séparée, à côté du produit.
- Pour Festival, aucune poignée n'est inventée : l'interface indique qu'elle doit être choisie séparément.
- Ordre de recherche : Designer Tapware Co, site officiel Nicolazzi, puis visuel local du catalogue PDF officiel.
- Les correspondances Designer Tapware Co validées par numéro de modèle sont enregistrées durablement dans PostgreSQL/Supabase, avec un cache fichier local de secours.
- Les anciennes associations Nicolazzi du navigateur sont invalidées une fois afin d'éviter de conserver une image supposée représenter une mauvaise poignée.

## Validation

- Vérification syntaxique Node/JavaScript.
- Tests Nicolazzi du catalogue PDF, du pont Designer Tapware et du nouveau visuel composite.
- Suite complète `npm run build`.
