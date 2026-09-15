# Hydropolis Studio V9.4 — PostgreSQL / Supabase

Cette version utilise automatiquement `DATABASE_URL` lorsqu'elle est définie dans Render.

## Données désormais persistantes dans Supabase PostgreSQL
- compte administrateur ;
- comptes des commerciaux ;
- coordonnées des commerciaux ;
- projets de chaque utilisateur ;
- données de devis / sélections / délais ;
- fiches techniques PDF personnalisées (stockées en BYTEA).

Au démarrage, Hydropolis crée automatiquement ses tables :
- `hydropolis_users`
- `hydropolis_projects`
- `hydropolis_assets`

Aucune commande SQL manuelle n'est nécessaire.

## Fonctionnement
- si `DATABASE_URL` est présente et valide : PostgreSQL est utilisé ;
- si elle est absente : fallback fichier local (uniquement pour test).

Dans « Mes projets », le bandeau indique maintenant :
`Stockage persistant actif — PostgreSQL / Supabase`
lorsque la connexion est opérationnelle.

Après installation de V9.4, le compte administrateur devra être créé une dernière fois
si la base Supabase est encore vide. Il restera ensuite enregistré lors des futurs déploiements.
