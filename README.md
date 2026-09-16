# Hydropolis Studio V10.13

## Hotbath / Sanitairkamer — correctif vitesse

La V10.12 pouvait devenir très lente à cause d'une erreur JavaScript serveur visible dans les logs :
`textFinish is not defined`. Cette erreur se produisait sur chaque page candidate Sanitairkamer et
forçait Hydropolis à continuer à parcourir toutes les variantes de finition.

### V10.13
- correction de l'erreur `textFinish is not defined` ;
- classement des URLs Sanitairkamer par la finition recherchée avant d'ouvrir les pages ;
- prise en compte du code article attendu (`B008GN`, `B008BC`, `B008BBP`, etc.) et du libellé finition dans le slug ;
- maximum de 6 pages candidates au lieu de 16 ;
- en pratique, si l'URL de la bonne finition est trouvée, une seule page est ouverte ;
- validation de seulement 2 images maximum sur la page correspondant à la bonne finition ;
- arrêt immédiat dès qu'une image exacte et accessible est trouvée ;
- une page d'une mauvaise finition n'est plus validée image par image ;
- cache navigateur fabricant renouvelé en V10.13.

Les documents techniques Hotbath continuent d'être récupérés depuis le site officiel Hotbath.
