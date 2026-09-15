# Hydropolis Studio V9.7

Correction définitive de la page fantôme « Accessoires & éléments complémentaires ».

La capture V9.6 a permis d'identifier la vraie cause :
un ancien bug avait enregistré le produit catalogue lui-même une seconde fois dans
« Éléments libres de la pièce ».

Exemple observé :
- produit catalogue : Classic wall mounted kitchen bridge mixer — 950 € HT
- ancien élément libre : Classic wall mounted kitchen bridge mixer with white levers — 950 € HT

Ce doublon était donc considéré comme un véritable élément libre par le dossier client.

## V9.7
- détecte les éléments libres qui doublonnent exactement un produit catalogue de la même pièce ;
- les supprime automatiquement à l'ouverture du projet ;
- enregistre automatiquement le projet nettoyé dans la base serveur ;
- les exclut du dossier client ;
- les exclut du devis ;
- les exclut des calculs de total et de marge ;
- les masque dans « Éléments libres » ;
- empêche de recréer manuellement le même doublon à l'avenir.

Les vrais éléments libres (meuble sur mesure, miroir, peinture, pose, etc.) restent inchangés.
