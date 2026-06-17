# Séquence 2 — Session de défi (détection scroll + notification)

*Diagramme source : `doo_sequence_session_defi.png`*

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant App as App externe (TikTok, Insta...)
    participant Doo as Doo
    participant S as Supabase

    U->>App: 1. Ouvre app et commence à scroller
    App-->>Doo: 2. Screen time détecté (API iOS/Android)
    Note over Doo: Démarre timer de session
    U->>App: scroll en cours...
    Note over Doo: Seuil quotidien atteint
    Doo-->>U: 3. Envoi de notification
    U->>App: 4. Ferme l'app de scroll
    U->>Doo: 5. Ouvre Doo
    Doo->>S: 6. SELECT challenge (context_key)
    S-->>Doo: 7. Retourne défi correspondant
    Doo-->>U: 8. Affiche le défi à l'écran
    U->>Doo: 9. Répond au défi
    Doo->>S: 10. INSERT answers
    S-->>Doo: 11. OK — réponse enregistrée
```

## Étapes

1. L'utilisateur ouvre une app externe (TikTok, Instagram...) et commence à scroller.
2. Doo détecte le temps d'écran via l'API native iOS/Android et démarre un timer de session.
3. Une fois le seuil quotidien atteint, Doo envoie une notification (le *Prompt* du modèle de Fogg) à l'utilisateur.
4. L'utilisateur ferme l'app de scroll et ouvre Doo.
5. Doo récupère le défi correspondant au contexte (`SELECT challenge` via `context_key`) et l'affiche à l'écran.
6. L'utilisateur répond au défi ; la réponse est enregistrée dans Supabase (`INSERT answers`).
