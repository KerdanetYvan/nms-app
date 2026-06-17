# Flow général de l'application Doo

*Diagramme source : `Flow_generale.png`*

Vue d'ensemble du parcours utilisateur, du téléchargement de l'app jusqu'à la complétion du programme, intégrant la boucle hebdomadaire et les déclenchements des algorithmes 2 et 3.

```mermaid
flowchart TD
    Start(["Téléchargement de l'app"])

    subgraph Onboarding["🎯 Onboarding"]
        O1["Déclarer l'usage actuel"] --> O2["Définir l'objectif cible"]
        O2 --> O3{"Niveau de motivation ?"}
        O3 -->|"Beaucoup"| OAgg["Aggressive"]
        O3 -->|"J'en ai besoin"| OMod["Moderate"]
        O3 -->|"Tout doux"| OGen["Gentle"]
    end

    Start --> O1
    OAgg --> Algo1
    OMod --> Algo1
    OGen --> Algo1

    Algo1["⚙️ Algo 1 — Génération du programme"]
    Algo1 --> Phase1["Phase 1 · Réduction légère"]
    Phase1 --> Semaine

    subgraph Boucle["🔁 Boucle hebdomadaire"]
        Semaine["📅 Semaine en cours<br/>Objectif de la semaine affiché"]
        Semaine --> Tenu{"Objectif tenu ?"}
        Tenu -->|"✗ Non"| Misses["consecutiveMisses++<br/>consecutiveSuccesses → 0"]
        Tenu -->|"✓ Oui"| Successes["consecutiveSuccesses++<br/>consecutiveMisses → 0"]

        Misses --> Misses2{"2 échecs consécutifs<br/>ou rechute franche ?"}
        Successes --> Successes2{"2 succès consécutifs ?"}

        Misses2 -->|"Oui"| Algo2["⚙️ Algo 2 — Recalibrage"]
        Misses2 -->|"Non"| PhaseCheck
        Successes2 -->|"Oui"| Algo3["🚀 Algo 3 — Accélération"]
        Successes2 -->|"Non"| PhaseCheck

        Algo2 --> PhaseCheck
        Algo3 --> PhaseCheck

        PhaseCheck{"Phase terminée ?"}
    end

    PhaseCheck -->|"Non · En cours"| Semaine
    PhaseCheck -->|"Phase 1 → Phase 2"| Phase2["Phase 2 · Réduction franche"]
    PhaseCheck -->|"Phase 2 → Phase 3"| Phase3["Phase 3 · Consolidation"]
    PhaseCheck -->|"Phase 3 terminée"| End(["🎉 Programme complété"])

    Phase2 --> Semaine
    Phase3 --> Semaine
```

## Logique résumée

1. **Onboarding** : déclaration de l'usage actuel → objectif cible → niveau de motivation (Beaucoup/J'en ai besoin/Tout doux → Aggressive/Moderate/Gentle).
2. **Algo 1** génère le programme ; démarrage en **Phase 1 · Réduction légère**.
3. **Boucle hebdomadaire** : chaque semaine affiche son objectif.
   - Objectif tenu → `consecutiveSuccesses++`, `consecutiveMisses → 0`. Si 2 succès consécutifs → **Algo 3** (accélération).
   - Objectif manqué → `consecutiveMisses++`, `consecutiveSuccesses → 0`. Si 2 échecs consécutifs (ou rechute franche) → **Algo 2** (recalibrage).
4. À la fin de chaque semaine, vérification de la phase :
   - Phase en cours non terminée → retour à la semaine suivante.
   - Phase 1 terminée → passage en **Phase 2 · Réduction franche**.
   - Phase 2 terminée → passage en **Phase 3 · Consolidation**.
   - Phase 3 terminée → **Programme complété** 🎉.
