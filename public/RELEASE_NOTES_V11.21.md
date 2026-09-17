# Hydropolis Studio V11.21

## Correctif Coalbrook

- Corrige l’affichage des photos officielles Coalbrook lorsque les images sont servies par le CDN officiel `coalbrook-bathrooms.transforms.svdcdn.com`.
- Autorise également le CDN technique Coalbrook `coalbrook-bathrooms.files.svdcdn.com`.
- Conserve le matching exact par référence et finition déjà opérationnel (`CP`, `GM`, `BB`, `BN`).
- Le proxy reste strictement limité aux hôtes Coalbrook nécessaires : aucun élargissement générique à `svdcdn.com`.
- Le moteur tente désormais aussi d’embarquer ces images côté serveur, afin de limiter les images cassées côté navigateur.
- Aucun changement sur les prix, ports Recor, devis ou dossier client.
