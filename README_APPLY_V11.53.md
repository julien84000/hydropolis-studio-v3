# Hydropolis Studio V11.53

## Objectif
- Remplacer les cartes Vismaravetro / TDA « À chiffrer » par un vrai configurateur technique.
- Ajouter Sira Concrete (vasques, plans vasque et baignoires) depuis le site officiel.
- Appliquer la remise d'achat Sira de 50 % dans le calcul de marge Hydropolis.

## Configurateur parois
Vismaravetro et TDA : collection → modèle officiel → implantation → dimensions → profil → verre → options → prix public HT.
Les modèles, dimensions, finitions, verres, options et documents sont lus sur le site officiel au moment de la configuration.

Important : le tarif public 2026 n'est pas extrapolé. Si la grille exacte n'est pas résolue, le prix public peut être saisi à la fin du configurateur et modifié ensuite dans le projet.

## Sira Concrete
Le configurateur lit les produits et fiches du site siraconcrete.com : produit → pigment → pose/options → tarif public.
Le site Sira affiche actuellement des prix techniques/placeholder à 1,00 € : Hydropolis les ignore volontairement. Le tarif public est saisi depuis la grille commerciale Sira. Le coût achat est calculé avec 50 % de remise.

## Render
Build Command : `node apply-v11.53-consolidated.js`
Start Command : `npm start`
