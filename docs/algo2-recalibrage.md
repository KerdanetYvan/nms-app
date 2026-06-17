# Algorithme 2 — Recalibrage dynamique (rechute / objectifs manqués)

*Diagramme source : `algo2_ajustement_cas_depassement.png`*

Se déclenche en cas de rechute franche (usage redevenu supérieur à la baseline initiale) ou de 2 semaines consécutives où l'objectif n'a pas été tenu. Recalibre le programme sans pénaliser ni dramatiser, conformément au modèle de Fogg (la motivation fluctue, l'écart est statistiquement normal).

```mermaid
flowchart TD
    A1["Rechute franche<br/>usage > baseline initiale"] --> A2["🔇 Flag silencieux activé<br/>Nouvelle baseline = moy. 2 sem.<br/>Aucune mention de régression"]
    B1["2 semaines ratées consécutives"]

    A2 --> C["Quelle a été la difficulté ces deux dernières semaines ?"]
    B1 --> C

    C --> D{"Raison"}

    D -->|"Période chargée ou stressante"| R1["Profil inchangé<br/>Extension de durée uniquement"]
    D -->|"Manque de motivation"| R2["Message remotivant<br/>+ Proposition baisse de profil"]
    D -->|"Trop difficile"| R3["Baisse de profil automatique<br/>aggressive → moderate → gentle"]
    D -->|"Quelque chose de difficile"| R4["Proposition pause 1-2 sem.<br/>ou extension de durée"]
    D -->|"Je ne sais pas trop"| R5["Profil inchangé<br/>Extension de durée uniquement"]

    R2 --> Q1{"Baisse de profil acceptée ?"}
    Q1 -->|"Oui"| R2a["Profil dégradé"]
    Q1 -->|"Non"| R2b["Extension de durée<br/>Profil inchangé"]

    R4 --> Q2{"Pause souhaitée ?"}
    Q2 -->|"Oui"| R4a["Pause 1-2 sem.<br/>Reprise automatique après"]
    Q2 -->|"Non"| R4b["Extension de durée"]

    R1 --> FB
    R2a --> FB
    R2b --> FB
    R3 --> FB
    R4a --> FB
    R4b --> FB
    R5 --> FB

    FB["💬 Feedback optionnel<br/>Champ libre · jamais obligatoire"]
    FB --> NB["Nouvelle baseline<br/>= moyenne de l'usage réel sur 2 semaines"]
    NB --> RC["Recalcul complet du programme<br/>currentDaily = nouvelle baseline<br/>weeklyRate = profil issu de cette session<br/>→ Algo 1"]
    RC --> Z["consecutiveMisses → 0<br/>Nouvelle date estimée affichée<br/>'Programme ajusté, on repart de là'"]
```

## Logique résumée

- **Déclencheurs** : rechute franche (usage > baseline initiale) → active un flag silencieux, nouvelle baseline = moyenne sur 2 semaines, sans mention explicite de régression à l'utilisateur ; ou 2 semaines ratées consécutives.
- L'app pose une question ouverte : *« Quelle a été la difficulté ces deux dernières semaines ? »*
- Selon la raison choisie :
  - **Période chargée ou stressante** → profil inchangé, extension de durée uniquement.
  - **Manque de motivation** → message remotivant + proposition de baisse de profil (acceptée → profil dégradé ; refusée → extension de durée, profil inchangé).
  - **Trop difficile** → baisse de profil automatique (aggressive → moderate → gentle).
  - **Quelque chose de difficile** → proposition de pause de 1-2 semaines ou d'extension de durée (pause acceptée → reprise automatique après ; refusée → extension de durée).
  - **Je ne sais pas trop** → profil inchangé, extension de durée uniquement.
- Un feedback libre et optionnel est proposé dans tous les cas (jamais obligatoire).
- La nouvelle baseline est recalculée comme la moyenne de l'usage réel sur les 2 dernières semaines.
- Le programme est entièrement recalculé (`currentDaily` = nouvelle baseline, `weeklyRate` = profil issu de cette session) en repassant par l'Algorithme 1.
- `consecutiveMisses` est remis à 0, et une nouvelle date estimée est affichée avec un message rassurant : *« Programme ajusté, on repart de là »*.
