# Algorithme 1 — Génération du programme de progression

*Diagramme source : `algo1_definition_progression.png`*

Calcule le programme de réduction du temps d'écran à partir des entrées de l'utilisateur (usage actuel, objectif cible, niveau de motivation) et génère les 3 phases du programme.

```mermaid
flowchart TD
    A["Entrées<br/>currentDaily · targetDaily · motivation"]
    A --> B["totalReduction = currentDaily − targetDaily"]
    B --> C{"Profil (motivation)"}

    C -->|"Beaucoup → Aggressive"| D1["weeklyRate = 1.0h · −60 min/sem"]
    C -->|"J'en ai besoin → Moderate"| D2["weeklyRate = 0.5h · −30 min/sem"]
    C -->|"Tout doux → Gentle"| D3["weeklyRate = 0.25h · −15 min/sem"]

    D1 --> E
    D2 --> E
    D3 --> E

    E["Phase 1 · Semaine 1<br/>phase1Reduction = weeklyRate × 0.5<br/>Objectif sem. 1 = currentDaily − phase1Reduction"]
    E --> F{"phase1Reduction ≥ totalReduction ?"}

    F -->|"Non"| G["Phase 2 · Réduction franche<br/>phase2Weeks = ceil[(totalReduction − phase1Reduction) / weeklyRate]<br/>Objectifs hebdo distribués sur courbe asymptotique · Lally 2010"]
    F -->|"Oui · objectif très petit"| H["📌 Phase 2 ignorée<br/>Passage direct en Phase 3"]

    G --> I
    H --> I

    I["Phase 3 · Consolidation<br/>4 semaines maintien à targetDaily<br/>Extrapolé · plancher Lally 18 jours"]
    I --> J["✅ Programme généré<br/>Jalons hebdomadaires<br/>Date estimée de complétion"]
```

## Logique résumée

1. **Entrées** : `currentDaily`, `targetDaily`, `motivation`
2. `totalReduction = currentDaily − targetDaily`
3. Le profil de motivation déclaré détermine le `weeklyRate` :
   - Beaucoup → **Aggressive** : 1.0h, soit −60 min/sem
   - J'en ai besoin → **Moderate** : 0.5h, soit −30 min/sem
   - Tout doux → **Gentle** : 0.25h, soit −15 min/sem
4. **Phase 1** (semaine 1) : réduction à demi-rythme (`weeklyRate × 0.5`), conformément à la courbe de Lally (résistance initiale maximale).
5. Si `phase1Reduction ≥ totalReduction`, la Phase 2 est ignorée (objectif déjà très proche) → passage direct en Phase 3.
6. Sinon, **Phase 2** : nombre de semaines = `ceil[(totalReduction − phase1Reduction) / weeklyRate]`, objectifs hebdomadaires distribués sur une courbe asymptotique.
7. **Phase 3** : 4 semaines de maintien à `targetDaily` (consolidation, extrapolé du plancher Lally de 18 jours).
8. Le programme généré inclut les jalons hebdomadaires et la date estimée de complétion.
