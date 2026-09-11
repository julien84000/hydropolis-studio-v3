# Hydropolis Studio V3.4 — correction des photos dynamiques

La V3.3 ne suffisait pas : Amphora change réellement le visuel dans le navigateur après sélection de la finition.

## Nouvelle méthode
La V3.4 utilise un navigateur Chromium côté serveur Render :
1. ouvre la fiche officielle du fabricant ;
2. cherche le menu de finition ;
3. sélectionne automatiquement `BS`, `BB` ou `BC` suivant la référence ;
4. attend le changement dynamique du visuel ;
5. récupère l'image produit affichée après cette sélection ;
6. renvoie cette photo à Hydropolis Studio.

Exemple de validation :
`RE001.BB` doit sélectionner **BB Brushed Black PVD** sur la fiche Amphora avant de récupérer le visuel.

## Important pour Render
Une nouvelle dépendance `puppeteer` est ajoutée. Le premier build sera donc plus long que les précédents car Chromium doit être installé.

## PDF client
La logique V3.3 est conservée :
- A4 paysage ;
- suppression automatique des grandes marges blanches autour de la photo ;
- petite marge de sécurité ;
- produit toujours visible en entier ;
- aucune déformation (`object-fit: contain`).

## Test
Après redéploiement :
1. faire un rechargement forcé du navigateur ;
2. rechercher `RE001.BB` ;
3. cliquer `Trouver la photo fabricant` ;
4. vérifier que le visuel est noir brossé et non acier ;
5. ajouter au projet puis vérifier `Aperçu PDF`.
