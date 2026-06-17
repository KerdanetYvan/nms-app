# Algorithme 3 — Accélération (réussite critique)

*Diagramme source : `algo3_acceleration_cas_reussite_critique.png`*

Se déclenche après 2 semaines consécutives où l'objectif est dépassé. Propose à l'utilisateur d'accélérer son programme.

```mermaid
flowchart TD
    A["2 semaines consécutives<br/>objectif dépassé"] --> B["🎉 Message de reconnaissance<br/>'Tu dépasses tes objectifs depuis 2 semaines'"]
    B --> C["Proposition d'accélération<br/>'Tu veux aller plus vite ?'"]
    C --> D{"Accepté ?"}

    D -->|"Non"| E["Programme inchangé<br/>'Pas de problème, tu gères à ton rythme'<br/>consecutiveSuccesses → 0"]
    D -->|"Oui"| F{"Profil actuel"}

    F -->|"Gentle"| G1["→ Moderate<br/>−30 min/sem"]
    F -->|"Moderate"| G2["→ Aggressive<br/>−60 min/sem"]
    F -->|"Aggressive · déjà au max"| G3["Phase 3 réduite<br/>4 semaines → 2 semaines"]

    G1 --> H
    G2 --> H
    G3 --> H

    H["Recalcul du programme<br/>nouveau weeklyRate appliqué<br/>→ Algo 1"]
    H --> I["consecutiveSuccesses → 0<br/>Nouvelle date estimée affichée<br/>'C'est parti, on accélère 🚀'"]

    E --> J(["Reprise du programme en cours"])
    I --> J
```

## Logique résumée

1. **Déclencheur** : 2 semaines consécutives avec objectif dépassé.
2. Message de reconnaissance : *« Tu dépasses tes objectifs depuis 2 semaines »*.
3. Proposition d'accélération : *« Tu veux aller plus vite ? »*
4. Si **refusé** : programme inchangé, `consecutiveSuccesses → 0`, message *« Pas de problème, tu gères à ton rythme »*.
5. Si **accepté**, le profil actuel détermine la suite :
   - **Gentle** → passe à **Moderate** (−30 min/sem)
   - **Moderate** → passe à **Aggressive** (−60 min/sem)
   - **Aggressive** (déjà au maximum) → Phase 3 réduite de 4 à 2 semaines
6. Le programme est recalculé avec le nouveau `weeklyRate` (retour à l'Algorithme 1).
7. `consecutiveSuccesses → 0`, nouvelle date estimée affichée avec le message *« C'est parti, on accélère 🚀 »*.
8. Reprise du programme en cours.
