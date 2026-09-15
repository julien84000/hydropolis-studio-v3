# Hydropolis Studio V9.5

Correction du dossier client concernant les accessoires optionnels.

## Comportement corrigé
Les compléments proposés sous un produit (siphon, bonde, vidage Recor, etc.) sont des suggestions.
Ils ne doivent apparaître ni dans le dossier client, ni dans le devis, ni dans le moodboard tant que
l'utilisateur n'a pas cliqué sur « + Ajouter » / « + Choisir ».

V9.5 force cette règle dans :
- les planches du dossier client ;
- le moodboard de couverture ;
- le devis final.

## Autre correction
Les « éléments libres » sont maintenant transformés correctement pour la présentation client.
Les anciens éléments vides/corrompus qui produisaient une page
« Accessoires & éléments complémentaires » avec `undefined` sont filtrés automatiquement.
