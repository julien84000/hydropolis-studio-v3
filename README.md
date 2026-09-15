# Hydropolis Studio V7.8

Correction Lefroy Brooks — documents techniques.

Le site Lefroy Brooks nomme ses documents :
- Technical Specification Sheet
- DWG File
- Installation & Servicing Guide

L'ancienne détection cherchait surtout « Technical sheet » / « Spec sheet » et ne reconnaissait
donc pas correctement « Technical Specification Sheet ».

Corrections :
- détection de « Technical Specification Sheet » et variantes ;
- détection de « Installation & Servicing Guide » et variantes ;
- fallback spécifique Squarespace /s/ pour les PDF Lefroy Brooks ;
- récupération des DWG conservée ;
- cache fabricant V7.8 pour invalider les anciennes réponses sans fiche technique ;
- à l'ouverture de « Projet par pièce », les produits Lefroy Brooks déjà sélectionnés sans document
  sont réinterrogés automatiquement en arrière-plan ;
- une fois le PDF récupéré, la case « Inclure la fiche technique » devient disponible.
