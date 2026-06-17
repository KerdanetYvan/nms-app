# Diagramme de cas d'utilisation — Doo

*Diagramme source : `doo_uml_cas_utilisation.png`*

Acteurs : **Utilisateur** et **Système (algo)**.

```mermaid
flowchart LR
    Utilisateur(["🧍 Utilisateur"])
    Systeme(["🤖 Système (algo)"])

    subgraph Doo["Doo"]
        subgraph Onboarding["Onboarding"]
            UC1(("Déclarer usage actuel"))
            UC2(("Définir objectif cible"))
            UC3(("Choisir niveau de motivation"))
        end
        subgraph Programme["Programme"]
            UC4(("Visualiser son programme"))
            UC5(("Consulter objectif de la semaine"))
        end
        subgraph SuiviHebdo["Suivi hebdomadaire"]
            UC6(("Consulter résultats de la semaine"))
            UC7(("Recevoir un défi lors d'une session"))
        end
        subgraph Adaptation["Adaptation"]
            UC8(("Rallonger le programme - algo 2"))
            UC9(("Accélérer le programme - algo 3"))
        end
        subgraph Notifications["Notifications"]
            UC10(("Recevoir prompt d'arrêt - Fogg"))
            UC11(("Recevoir rappel hebdomadaire"))
        end
    end

    Utilisateur --- UC1
    Utilisateur --- UC2
    Utilisateur --- UC3
    Utilisateur --- UC4
    Utilisateur --- UC5
    Utilisateur --- UC6
    Utilisateur --- UC7
    Utilisateur --- UC8
    Utilisateur --- UC9
    Utilisateur --- UC10
    Utilisateur --- UC11

    UC7 -.->|"include"| UC8

    Systeme --- UC8
    Systeme --- UC9
    Systeme --- UC10
    Systeme --- UC11
```

## Cas d'utilisation par catégorie

**Onboarding**
- Déclarer usage actuel
- Définir objectif cible
- Choisir niveau de motivation

**Programme**
- Visualiser son programme
- Consulter objectif de la semaine

**Suivi hebdomadaire**
- Consulter résultats de la semaine
- Recevoir un défi lors d'une session *(inclut : Rallonger le programme — algo 2)*

**Adaptation**
- Rallonger le programme (algo 2)
- Accélérer le programme (algo 3)

**Notifications**
- Recevoir prompt d'arrêt (Fogg)
- Recevoir rappel hebdomadaire

## Acteurs et associations

- **Utilisateur** est associé à l'ensemble des cas d'utilisation.
- **Système (algo)** est associé aux cas : Rallonger le programme (algo 2), Accélérer le programme (algo 3), Recevoir prompt d'arrêt (Fogg), Recevoir rappel hebdomadaire.
