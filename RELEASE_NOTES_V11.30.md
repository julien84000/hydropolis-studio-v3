# V11.30 — Hotbath

- Suppression des recherches de secours répétées par le navigateur.
- Catalogue : affiche le visuel officiel disponible sans attendre une recherche de finition supplémentaire. La finition non certifiée reste indiquée comme générique.
- Réutilisation des octets téléchargés pendant la validation.
- Arrêt de la recherche Web lorsqu'une référence exacte Sanitairkamer est trouvée.
- Recherche de secours bornée à trois pages Sanitairkamer et trois images Bing.
- Cache serveur Hotbath de dix minutes, limité à huit résultats ; requêtes identiques simultanées mutualisées. Finitions et modes photo/documents séparés.
- Correctifs Nicolazzi et Zucchetti de la V11.29 conservés.

Validation : npm run build et tests comportementaux Hotbath. Le gain de temps sur le serveur de production reste à mesurer ; les délais du fournisseur peuvent subsister.
