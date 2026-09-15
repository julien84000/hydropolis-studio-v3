# Hydropolis Studio V9.3

Correction de l'upload des fiches techniques personnalisées.

## Problème corrigé
Dans les versions précédentes, un PDF chargé manuellement était enregistré uniquement dans le navigateur
avec une URL `blob:`. Cette URL n'était pas exploitable correctement par le générateur du dossier client
et n'était pas partagée avec les autres postes.

## V9.3
- « Modifier l'article » accepte un PDF de fiche technique jusqu'à 10 Mo ;
- le PDF est envoyé au serveur et rattaché au projet + à l'article ;
- le nom du fichier chargé est affiché dans l'éditeur ;
- le lien « Fiche personnalisée » permet de l'ouvrir ;
- la case « Inclure la fiche technique » fonctionne avec le PDF personnalisé ;
- la première page du PDF peut être intégrée dans le dossier client ;
- le PDF est accessible à l'utilisateur propriétaire du projet ;
- « Rétablir la fiche fabricant » supprime la fiche personnalisée et recherche à nouveau le document officiel.

Important : pour conserver les PDF après un redéploiement Render, `HYDRO_DATA_DIR` doit être placé
sur un disque persistant, comme indiqué dans la page « Mes projets ».
