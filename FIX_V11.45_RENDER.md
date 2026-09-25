# Correctif V11.45 Render

Le consolidateur initial contrôlait la chaîne littérale `V11.43_EDITABLE_QUOTE`.
Le script V11.43 installe pourtant correctement `renderQuoteEditor()` sans écrire ce marqueur littéral.

Le contrôle V11.45 accepte désormais soit le marqueur, soit la fonction réellement installée.
La chaîne V11.42 -> V11.43 -> V11.44 -> V11.45 a été vérifiée sur l'état actuel du dépôt GitHub.
