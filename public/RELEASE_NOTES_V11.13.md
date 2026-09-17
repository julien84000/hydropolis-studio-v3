# Hydropolis Studio V11.13 — Release notes

## Base de construction

- Base stable : `Hydropolis_Studio_V10.16_Update.zip`
- SHA-256 base : `415242ad95036f7db3e76844ec2fea8a5c8d916c1a8c1617350847c32507d5cd`
- Branche de référence sélective : `Hydropolis_Studio_V11.12_Update.zip`
- SHA-256 référence : `1cdfcf0f1e30b11c40df1786232243c35993a9e9af18827a697cacd49253141d`
- Méthode : évolution additive de V10.16 et cherry-pick des apports utiles V11.12 ; aucune réécriture du cœur métier.

## Nouveautés V11.13

- interface V11 modernisée et plus visuelle ;
- recherche fédérée catalogue local + index serveur + cache hors connexion ;
- suggestions intelligentes et alternatives ;
- comparateur jusqu'à quatre produits ;
- statut prix / finition / disponibilité ;
- export Excel enrichi avec synthèse financière ;
- export moodboard PNG ;
- service worker et reprise locale des projets déjà ouverts hors connexion ;
- manifeste fabricants extensible ;
- index catalogue serveur ;
- optimisation de la recherche locale et limitation du rendu à 120 cartes ;
- Drawing JPG Hotbath de la branche V11.12 réintégré ;
- conservation Sanitairkamer, Recor pieds obligatoires et Zucchetti PDF page 3.

## Fiabilité / sécurité

- TVA 0 % restaurée correctement ;
- `purchasePrice:null` ne devient plus un coût d'achat nul ;
- les lignes libres ne sont plus supprimées/masquées par ressemblance avec le catalogue ;
- alerte/restauration de brouillon local avant écrasement ;
- duplication de projet avec copie des assets ;
- révocation des sessions après changement de mot de passe ;
- échappement renforcé des textes utilisateur dans les principaux rendus HTML ;
- proxys distants limités aux domaines utiles, refus des IP privées/locales, redirections contrôlées et limites de taille ;
- le service worker ne met jamais en cache les réponses `/api/` authentifiées.

## Vérifications exécutées

- `node --check server.js` : OK
- `node --check public/app.js` : OK
- `node --check public/sw.js` : OK
- `node tests/v11-smoke.js` : OK
- catalogue : 21 284 lignes, 21 280 couples fabricant/référence uniques, 7 fabricants : OK
- préservation par déclaration : 171/171 fonctions client V10.16 et 101/101 fonctions serveur V10.16 toujours présentes : OK
- ancres DOM V11 : OK

## Limite de validation dans l'environnement de génération

Le test serveur complet n'a pas pu être lancé car `npm install` n'a pas pu joindre `registry.npmjs.org` (`EAI_AGAIN`, résolution DNS indisponible). Les contrôles syntaxiques et tests sans dépendances ont été exécutés. Un test d'exécution local/Render reste à faire après installation normale des dépendances.

## Fabricants

La structure est prête à recevoir de nouveaux connecteurs/catalogues, mais V11.13 n'annonce comme intégrés que les 7 fabricants disposant réellement de données dans le ZIP. Aucun fabricant ou stock n'a été inventé.
