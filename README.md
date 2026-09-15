# Hydropolis Studio V11.12

## Correctif Hotbath Drawing JPG — session Hotbath

Les logs confirmaient que Hydropolis trouvait correctement le Drawing Hotbath :
`drawing:true`, `drawingType:"image"` et une URL du type `B008-LT-rel1.jpg`.

Le problème se trouvait ensuite au chargement de l'image dans le dossier client :
Hotbath peut publier le lien Drawing dans la page produit tout en refusant un accès
direct sans le contexte/session de la fiche produit.

### V11.12

- nouvel endpoint `/api/hotbath-drawing-image` ;
- Hydropolis ouvre d'abord la fiche produit officielle Hotbath ;
- récupère les cookies de session éventuels ;
- relit le lien `Drawing` directement dans cette fiche ;
- télécharge ensuite le JPG avec le `Referer` et la session Hotbath ;
- renvoie l'image au dossier client depuis le même domaine Render ;
- si cette méthode échoue, l'aperçu tente encore l'URL Hotbath directe ;
- nouveaux logs : `[hotbath-drawing-image]` ou `[hotbath-drawing-image-failed]`.

### Choix utilisateur conservé

Le Drawing n'est jamais imposé :
- case décochée → aucune page Drawing dans le dossier ;
- case cochée → page Drawing dans le dossier ;
- le choix est sauvegardé article par article.

`Technical info` et `Instructions` Hotbath restent exclus.
