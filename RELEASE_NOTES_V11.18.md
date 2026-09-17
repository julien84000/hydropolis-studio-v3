# Hydropolis Studio V11.18

## Recor — présentation dossier client

- Composition baignoire + accessoires : la baignoire reste dominante, avec un rail compact à côté.
- Pieds : miniature + modèle + finition.
- Vidage : texte + finition uniquement, sans visuel conformément au choix produit.
- Les accessoires liés restent présents dans le devis/marge mais ne sont plus dupliqués en grandes cartes dans la présentation client.

## Recor — fiabilité des visuels

- Les 8 visuels de pieds fournis sont embarqués directement dans le bundle applicatif afin d’éviter les problèmes de chemins statiques ou de cache.
- Le connecteur officiel Recor remplace maintenant une miniature WordPress par la version de meilleure définition lorsqu’elles représentent la même image.
- `data-large_image` et les grandes variantes de `srcset` sont prioritaires.
- Les baignoires Recor sont ré-enrichies depuis le site fabricant lors de leur ajout pour éviter les anciens visuels basse définition.
