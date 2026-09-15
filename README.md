# Hydropolis Studio V11.7

## Correctif Hotbath — références `.IT`, exactitude et qualité d'image

Cette version corrige la chaîne Hotbath à partir des constats faits directement sur
la fiche officielle `AC003H` et les pages Sawiday.

### 1. `.IT` n'est plus utilisé sur le web

Le suffixe `.IT` provient du tarif/catalogue fournisseur mais ne fait pas partie de la
référence publique Hotbath.

Exemples :
- `AC003H.MBP.IT` → Hotbath : `AC003H.MBP`
- `AC003H.BBP.IT` → Hotbath : `AC003H.BBP`
- Sawiday : `AC003HBBP`

La référence d'origine avec `.IT` reste conservée dans Hydropolis pour le catalogue et
les devis. La normalisation ne sert qu'aux recherches web.

### 2. Photo officielle Hotbath

Hydropolis n'analyse plus toutes les images de la page Hotbath.
Il utilise uniquement la photo située dans `#imgprod`.

Une photo officielle n'est considérée comme exacte que si `#descrbar` affiche exactement
la référence normalisée demandée.

Exemple vérifié :
- fiche Hotbath `AC003H`
- `#descrbar` = `AC003H.MBP`
- image principale = `.../AC003H_2.jpg`

Si l'utilisateur demande `AC003H.BBP.IT`, cette photo MBP n'est donc pas réutilisée.

### 3. Sawiday exact + haute résolution

Quand Hotbath ne donne pas la finition exacte :
- recherche du numéro fournisseur exact (`AC003HBBP`, `CB003CBB`, etc.) ;
- la page produit Sawiday doit contenir cette référence dans son propre titre/spécifications ;
- seules les images de la galerie de CE produit sont retenues ;
- les recommandations et produits associés sont exclus ;
- l'image 2000×2000 est privilégiée au lieu de la vignette 320×320.

### 4. Règle de sécurité

Pour Hotbath, lorsqu'une finition est demandée :
**aucune image d'une autre finition n'est utilisée en remplacement.**

Mieux vaut afficher « photo à rechercher » qu'une photo incorrecte.

### 5. Documents Hotbath

La logique reste :
- `Drawing` → dessin technique JPG officiel ;
- `Technical info` → fiche technique JPG/PDF ;
- `Instructions` → notice PDF ;
- `CAD` → IGS/STP/3DS/DWG.

Le Drawing JPG reste disponible pour intégration dans la fiche produit et le dossier client.
