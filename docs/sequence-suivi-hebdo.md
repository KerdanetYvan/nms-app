# Séquence 3 — Suivi hebdomadaire & déclenchement des algos 2/3

*Diagramme source : `doo_sequence_suivi_hebdo.png`*

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant App as App
    participant S as Supabase
    participant Algo2 as Algo 2
    participant Algo3 as Algo 3

    U->>App: 1. Ouvre écran suivi
    App->>S: 2. SELECT weekly_tracking
    S-->>App: 3. Résultats semaine
    App-->>U: 4. Affiche résultats semaine
    Note over App: Évalue compteurs

    alt consecutiveMisses = 2
        App->>Algo2: 5a. Déclenche algo 2
        Algo2->>S: 6a. UPDATE programs (rallonge)
        Algo2-->>App: 7a. Nouvelle date estimée
    end

    alt consecutiveSuccesses = 2
        App->>Algo3: 5b. Déclenche algo 3
        Algo3->>S: 6b. UPDATE programs (accélère)
        Algo3-->>App: 7b. Nouvelle date estimée
    end

    App-->>U: 8. Notifie utilisateur
```

## Étapes

1. L'utilisateur ouvre l'écran de suivi ; l'app récupère les résultats de la semaine (`SELECT weekly_tracking`) et les affiche.
2. L'app évalue les compteurs `consecutiveMisses` et `consecutiveSuccesses`.
3. Si `consecutiveMisses = 2` → déclenchement de l'**Algo 2**, qui met à jour le programme (rallonge) et retourne la nouvelle date estimée.
4. Si `consecutiveSuccesses = 2` → déclenchement de l'**Algo 3**, qui met à jour le programme (accélère) et retourne la nouvelle date estimée.
5. L'app notifie l'utilisateur du résultat.
