# Hydropolis Studio V11.37

## Ritmonio — correction de détection « Scheda tecnica »

Les logs V11.36 indiquaient :
`Scheda tecnica absente de la fiche Ritmonio ...`

La fiche était pourtant bien présente sur le site. La cause exacte est désormais identifiée dans le HTML Ritmonio :

```html
<h5>Scheda<br>tecnica</h5>
```

Le parseur HTML transformait ce libellé en `Schedatecnica` au lieu de `Scheda tecnica`. La détection cherchait uniquement les deux mots séparés et concluait donc, à tort, que le PDF était absent.

### Correctif
- prise en compte explicite des balises `<br>` comme séparateurs ;
- reconnaissance de `Scheda tecnica` et `Schedatecnica` ;
- même correction pour `Istruzioni di montaggio` ;
- conservation du flux exact-code V11.36 ;
- la Scheda tecnica reste enregistrée comme PDF et peut être cochée dans « Projet par pièce ».

Exemple vérifié : `PR50AF201` → Scheda tecnica officielle Ritmonio de 2 pages.
