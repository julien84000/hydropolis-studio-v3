# Hydropolis Studio V11.22

## Correctif Recor — fiches/drawings techniques

- Le dossier client transmet maintenant la fiche produit Recor exacte au convertisseur PDF.
- Le serveur ouvre d’abord la fiche produit officielle Recor, récupère la session/cookies et relit le lien **Technical drawing** en direct.
- Le PDF est ensuite demandé avec la session officielle Recor avant conversion en image PNG pour le dossier client.
- La réponse est validée par la signature `%PDF-` : une page HTML de vérification anti-bot n’est plus envoyée à pdf.js comme si elle était un PDF.
- Les autres fabricants et la logique Coalbrook V11.21 restent inchangés.
