# Hydropolis Studio V4.6

## Correctif Coalbrook — photos produit
La V4.5 pouvait sélectionner les pastilles circulaires de finition à la place du produit.

La V4.6 :
- exclut explicitement les swatches Coalbrook (Chrome, Gunmetal, Brushed Brass, Brushed Nickel) ;
- ignore les miniatures de 50 px ;
- utilise les quatre vraies images produit de la fiche officielle ;
- associe la finition à partir du suffixe du SKU officiel présent dans l'URL de l'image :
  - CP = Chromé
  - GM = Gunmetal
  - BB = Laiton brossé
  - BN = Nickel brossé
- fonctionne même lorsque la référence du tarif Excel diffère de la référence web actuelle de Coalbrook ;
- passe le cache photo en V4.6 afin de ne pas réutiliser les anciennes pastilles mémorisées.

Les filtres dépendants par fabricant de la V4.5 sont conservés.
