# Doo — Fondation scientifique de l'algorithme de progression

*Document de référence — présentation aux référents*

## Contexte et problématique

Le doomscrolling est un comportement à fort ancrage habituel, partageant plusieurs caractéristiques des addictions comportementales. L'objectif de Doo n'est pas d'empêcher l'accès aux réseaux sociaux — ceux-ci sont devenus une source d'information légitime — mais de réapprendre à l'utilisateur à contrôler son usage, et à tolérer l'ennui sans recourir au scroll comme réflexe automatique.

L'algorithme de Doo prend en entrée le temps d'usage quotidien actuel et l'objectif déclaré par l'utilisateur, calcule une durée estimée réaliste, et génère un programme hebdomadaire adapté. Un second algorithme surveille la tenue des objectifs et recalibre le programme en cas d'écart, sans dramatiser ni pénaliser.

Ce document présente les deux piliers scientifiques sur lesquels repose ce modèle, en distinguant explicitement les éléments directement sourcés et ceux qui relèvent d'extrapolations assumées.

## Pilier 1 — La courbe de formation d'habitude

**Lally, P., van Jaarsveld, C.H.M., Potts, H.W.W. & Wardle, J. (2010)**
*European Journal of Social Psychology*, 40, 998–1009 — https://doi.org/10.1002/ejsp.674

Cette étude est la référence académique sur la dynamique temporelle du changement d'habitude. Elle établit deux points essentiels pour notre modèle.

**La progression n'est pas linéaire.** La courbe est asymptotique : les premières répétitions du nouveau comportement produisent de grandes variations d'automaticité, qui diminuent progressivement jusqu'à atteindre un plateau stable. Dans le contexte de Doo, cela signifie que les premières semaines sont les plus difficiles — la résistance du comportement de scrolling est maximale — puis la charge perçue diminue à mesure que la nouvelle habitude s'ancre.

**La durée est hautement variable.** La plage observée est de 18 à 254 jours pour une moyenne de 66 jours, selon la personne et le comportement. Cela justifie que l'algorithme propose des profils de progression différenciés plutôt qu'une durée fixe universelle.

**Traduction algorithmique** : les objectifs hebdomadaires ne sont pas distribués uniformément. La phase 1 est volontairement légère parce que la résistance initiale est à son maximum. La phase 2 frappe plus fort parce que l'automaticité du nouveau comportement commence à s'installer. La phase 3 maintient le plateau atteint pour valider l'ancrage réel — atteindre l'objectif ponctuellement ne suffit pas.

## Pilier 2 — Le modèle comportemental B=MAP

**Fogg, B.J. (2009 / 2020) — Stanford Behavior Design Lab**
Modèle académique : https://behaviordesign.stanford.edu/resources/fogg-behavior-model
*Tiny Habits*, Houghton Mifflin Harcourt (2020) : https://www.bjfogg.com

Le modèle B=MAP stipule qu'un comportement se produit uniquement lorsque trois éléments sont réunis simultanément : Motivation, Ability (capacité à l'exécuter) et Prompt (signal déclencheur). Pour stopper un comportement, il suffit de supprimer l'un de ces trois éléments.

Le levier le plus fiable n'est pas la Motivation — Fogg est explicite sur ce point : la motivation monte et descend dans le temps, il est presque impossible de la maintenir durablement. Doo ne cherche pas à agir sur la Motivation ni sur l'Ability — l'accès aux réseaux reste libre et intact. Le levier de Doo est le Prompt : la notification comme signal d'arrêt conscient, déclenchée au bon moment.

**Traduction algorithmique** : la notification de Doo — *« tu as épuisé ton temps pour aujourd'hui »* — est le Prompt qui rend la décision d'arrêt consciente au moment précis où l'inertie du scrolling est la plus forte. Le programme ne repose pas sur la volonté permanente de l'utilisateur pour tenir ses objectifs. Il s'appuie sur ce signal régulier pour traverser les semaines difficiles de la courbe Lally, notamment en phase 1 où la résistance est maximale.

## Synthèse — Architecture du programme

### Algorithme 1 — Programme de progression

**Phase 1 — Réduction légère**
La résistance au changement est à son maximum (Lally). L'objectif hebdomadaire est volontairement bas — une réduction modeste mais tenue vaut mieux qu'une ambition non tenue. Le Prompt de Doo est particulièrement critique ici : c'est lui qui compense la faiblesse structurelle de la Motivation en début de programme (Fogg).

**Phase 2 — Réduction franche**
L'automaticité du nouveau comportement commence à s'installer. La courbe de Lally entre dans sa phase d'accélération. Les objectifs hebdomadaires augmentent en conséquence. L'utilisateur commence à percevoir le changement comme normal plutôt que comme un effort.

**Phase 3 — Consolidation**
L'objectif cible est atteint. Cette phase ne réduit plus — elle maintient, jusqu'au plateau d'automaticité de Lally. C'est la validation réelle du programme : le nouveau comportement est ancré, pas seulement atteint ponctuellement.

> ⚠️ **Extrapolation assumée** — les rythmes de réduction (doux : ~15 min/semaine, modéré : ~30 min/semaine, intensif : ~60 min/semaine) sont extrapolés de la pratique clinique TCC pour addictions comportementales. Aucune étude directe sur le doomscrolling ne les valide à ce stade.

> ⚠️ **Extrapolation assumée** — la durée de consolidation (~4 semaines) est une approximation prudente dérivée du plancher de 18 jours observé dans Lally (2010).

### Algorithme 2 — Recalibrage dynamique

Si un objectif hebdomadaire n'est pas tenu, le programme se réorganise sans pénaliser ni dramatiser. Ce comportement est cohérent avec Fogg : la Motivation fluctue structurellement, un écart ponctuel est donc statistiquement normal et doit être absorbé par le système. Le programme recalibré repart du niveau effectivement tenu, recalcule les phases suivantes, et met à jour l'estimation de durée totale communiquée à l'utilisateur.

### Sur l'estimation communiquée à l'utilisateur

L'algorithme affiche uniquement l'estimation réaliste, jamais l'optimiste. L'objectif affiché à chaque session est celui de la semaine en cours uniquement — cohérent avec Fogg, qui déconseille d'exposer l'intégralité du programme pour ne pas fracturer la motivation dès le premier écart.

## Récapitulatif des sources

| Étude | Apport | Statut |
|---|---|---|
| Lally et al. (2010) | Courbe asymptotique d'ancrage d'habitude — forme et plateau | ✅ Sourcé |
| Fogg B=MAP (2009/2020) | Le Prompt comme levier stable face à une Motivation fluctuante | ✅ Sourcé |
| Rythmes 15/30/60 min/sem. | Cadence de réduction selon le profil utilisateur | ⚠️ Extrapolé |
| Consolidation ~4 semaines | Phase de stabilisation post-objectif | ⚠️ Extrapolé |
