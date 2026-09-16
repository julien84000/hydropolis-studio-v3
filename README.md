# Hydropolis Studio V10.15

## Correctif Recor — bouton « Configurer + ajouter »

La cause du bouton inactif a été identifiée : le configurateur Recor appelait `normalizeText()` pour trouver les pieds et vidages compatibles, mais cette fonction n'existait pas dans le JavaScript client. Le clic provoquait donc une erreur avant l'ouverture de la fenêtre de configuration.

### Corrections
- ajout de la fonction `normalizeText()` ;
- ouverture du configurateur Recor rétablie ;
- recherche des pieds compatibles Carlton, Dual, Roll Top, etc. ;
- ajout atomique baignoire + pieds obligatoires + vidage optionnel ;
- messages d'erreur visibles si un problème client survient ;
- logs `Recor configurator request`, `Recor configurator data`, `Recor configurator open` et `Recor configurator add`.

Les corrections Hotbath/Sanitairkamer des versions précédentes sont conservées.
