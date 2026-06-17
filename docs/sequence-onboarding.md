# Séquence 1 — Onboarding & génération du programme

*Diagramme source : `doo_sequence_onboarding.png`*

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant A as App (React Native)
    participant S as Supabase
    participant Algo as Algo 1

    U->>A: 1. Saisit usage actuel
    U->>A: 2. Saisit objectif cible
    U->>A: 3. Choisit niveau de motivation
    A->>S: 4. INSERT user_profiles
    S-->>A: 5. OK
    A->>Algo: 6. Calcule programme (weeklyRate, phases)
    Algo->>S: 7. INSERT programs + weekly_tracking
    S-->>Algo: 8. OK
    Algo-->>A: 9. Retourne programme généré
    A-->>U: 10. Affiche programme + date estimée
```

## Étapes

1. L'utilisateur saisit son usage actuel, son objectif cible et son niveau de motivation dans l'app.
2. L'app insère le profil dans Supabase (`user_profiles`).
3. L'app appelle l'Algo 1 pour calculer le programme (`weeklyRate`, phases).
4. L'Algo 1 insère le programme et le suivi hebdomadaire (`programs` + `weekly_tracking`) dans Supabase, puis retourne le programme généré à l'app.
5. L'app affiche le programme et la date estimée de complétion à l'utilisateur.
