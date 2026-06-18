# Doo

**Doo** est une application mobile Android anti-doomscrolling. Elle surveille le temps passé sur les apps de scroll configurées par l'utilisateur, envoie des alertes de quota journalier et propose des défis courts et concrets adaptés au contexte du moment — dans le bus, en pause, dans son lit, dans la salle d'attente, dans le métro ou à la maison.

---

## Documentation

| Document | Contenu |
|---|---|
| [docs/flow-generale.md](docs/flow-generale.md) | Flow général de l'application |
| [docs/supabase-schema.md](docs/supabase-schema.md) | Schéma de base de données Supabase |
| [docs/algo1-definition-progression.md](docs/algo1-definition-progression.md) | Algo 1 — génération du programme de progression |
| [docs/algo2-recalibrage.md](docs/algo2-recalibrage.md) | Algo 2 — recalibrage dynamique en cas d'échec/rechute |
| [docs/algo3-acceleration.md](docs/algo3-acceleration.md) | Algo 3 — accélération en cas de réussite répétée |
| [docs/fondation-scientifique.md](docs/fondation-scientifique.md) | Bases scientifiques (Lally 2010, Fogg B=MAP) |
| [docs/sequence-onboarding.md](docs/sequence-onboarding.md) | Séquence — onboarding & génération du programme |
| [docs/sequence-session-defi.md](docs/sequence-session-defi.md) | Séquence — session de défi |
| [docs/sequence-suivi-hebdo.md](docs/sequence-suivi-hebdo.md) | Séquence — suivi hebdomadaire |
| [docs/matrice-decisionnelle.md](docs/matrice-decisionnelle.md) | Comparatif technique React Native/Flutter, Supabase/Firebase |
| [docs/uml-cas-utilisation.md](docs/uml-cas-utilisation.md) | Diagramme de cas d'utilisation |

---

## Fonctionnalités

### Authentification & onboarding
- **Landing** — Écran de bienvenue pour les utilisateurs non connectés.
- **Authentification** — Création de compte (avec barre de complexité mot de passe) et connexion email/mot de passe via Supabase Auth.
- **Confirmation e-mail** — Saisie du code OTP reçu par mail. Bouton "Renvoyer le code" inclus.
- **Onboarding** — Formulaire 6 étapes : raison d'usage, temps d'écran actuel, objectif, applications chronophages, moments de scroll, niveau de motivation. Programme généré et sauvegardé à la fin.

### Programme de réduction
- **Génération** — Algorithme personnalisé basé sur la courbe d'ancrage d'habitude de Lally (2010) et le modèle B=MAP de Fogg : phase d'introduction (2 semaines), réduction progressive sur courbe sigmoïde, consolidation.
- **Visualisation** — Graphique de progression (courbe Catmull-Rom lissée, aire dégradée, points colorés par phase) avec détail par phase.
- **Recalibrage dynamique** — Algo 2 déclenché en cas de dépassements répétés. Algo 3 en cas de réussite continue.

### Surveillance Android
- **Service foreground** — `MonitoringService` (Kotlin) tourne en arrière-plan avec `START_REDELIVER_INTENT`. Survit à la fermeture de l'app.
- **Détection d'ouverture** — Détecte via `queryEvents` quand une app surveillée est lancée.
- **Notifications de quota journalier** :
  - À 80% du quota → "Objectif bientôt atteint"
  - À 100% → "Quota atteint"
  - App relancée après dépassement → "Tu as dépassé ton quota pour aujourd'hui, viens t'ennuyer un peu" (cooldown 5 min)
- **Mode dev** — Notification persistante affichant le temps passé par app, mis à jour toutes les 5 s.
- **Exemption batterie** — Bouton pour désactiver l'optimisation batterie Android et garantir la continuité du service.
- **Module natif** — `modules/usage-stats/` (Expo Modules API, Kotlin) expose `UsageStatsManager`, `queryEvents`, `queryUsageStats`, et le service foreground à React Native.

### Profil & statistiques
- **Temps d'écran du jour** — Temps total + économisé + barre de progression vs objectif journalier, calculés en temps quasi-réel via `UsageStatsManager`.
- **Top apps du jour** — Liste des apps surveillées avec leur temps de la journée.
- **Récap hebdomadaire** — Page dédiée avec :
  - Temps d'écran moyen de la semaine vs objectif, avec indicateur de réussite.
  - Graphique en barres (Lun–Dim), jour actuel mis en évidence en orange.
  - Classement des apps surveillées avec barres horizontales proportionnelles.
  - Comparaison avec la semaine précédente (delta en minutes).

### Défis
- **Sélection de contexte** — Tu choisis ton contexte (bus, métro, lit…) et Doo propose un défi adapté.
- **Défi aléatoire** — Tiré au sort parmi la banque de défis. Bouton shuffle pour en piocher un autre.
- **Réponse au défi** — Saisie libre sauvegardée et liée au compte utilisateur.

### Paramètres
- **Surveillance d'apps** — Configuration des apps à surveiller + statut exemption batterie.
- **Notifications** — Activation/désactivation des rappels avec sélection d'heure.
- **Informations personnelles** — Édition prénom, nom, date de naissance, téléphone.
- **Pages légales** — Politique de confidentialité RGPD et conditions d'utilisation.

---

## Stack technique

### Frontend

| Outil | Rôle |
|---|---|
| React Native + Expo (Bare Workflow) | Framework mobile Android |
| TypeScript | Typage strict |
| Expo Router | Navigation basée sur les fichiers |
| react-native-reanimated | Animations |
| react-native-svg | Graphiques (programme, week-recap) |
| @expo-google-fonts/quicksand | Police Quicksand |
| expo-notifications | Notifications locales |
| Expo Modules API (Kotlin) | Module natif `usage-stats` |

### Backend

| Outil | Rôle |
|---|---|
| Supabase Auth | Authentification email/password + OTP |
| Supabase PostgreSQL | Base de données avec RLS |
| @supabase/supabase-js | Client direct depuis l'app |

> L'app cible **Android uniquement**. `UsageStatsManager` (Android API) n'a pas d'équivalent accessible sur iOS.

---

## Structure du projet

```
nms-app/
├── docs/                              — Documentation technique (algo, schéma, UML)
├── frontend/
│   ├── android/                       — Projet Android natif (généré par expo prebuild)
│   ├── modules/
│   │   └── usage-stats/               — Module natif Expo (Kotlin) : UsageStatsManager + foreground service
│   │       ├── android/src/.../
│   │       │   ├── MonitoringService.kt   — Service foreground + notifs quota
│   │       │   └── UsageStatsModule.kt    — API exposée à React Native
│   │       └── src/index.ts               — Exports TypeScript du module
│   ├── app/                           — Screens Expo Router (un fichier = une route)
│   │   ├── _layout.tsx                — Layout racine, garde de session auth
│   │   ├── welcome.tsx                — Landing page
│   │   ├── auth.tsx                   — Login / register
│   │   ├── confirm-email.tsx          — Saisie du code OTP
│   │   ├── onboarding.tsx             — Formulaire d'onboarding 6 étapes
│   │   ├── week-recap.tsx             — Récapitulatif hebdomadaire
│   │   ├── app-surveillance-settings.tsx — Paramètres surveillance + exemption batterie
│   │   ├── notifications-settings.tsx — Paramètres notifications
│   │   ├── personal-info.tsx          — Édition des informations personnelles
│   │   ├── privacy.tsx                — Politique de confidentialité
│   │   ├── terms.tsx                  — Conditions d'utilisation
│   │   └── (tabs)/
│   │       ├── index.tsx              — Accueil, sélection du contexte
│   │       ├── program.tsx            — Visualisation du programme
│   │       ├── profile.tsx            — Profil + stats temps réel
│   │       └── settings.tsx           — Paramètres
│   └── src/
│       ├── algorithms/                — Logique métier pure (generateProgram, algo2, algo3)
│       ├── api/                       — Client Supabase (requêtes BDD)
│       ├── components/                — Composants réutilisables
│       ├── hooks/                     — use-auth, use-daily-usage, use-app-monitoring, use-permissions
│       ├── lib/                       — Singleton Supabase (AsyncStorage adapter)
│       ├── theme/                     — Design tokens (colors.ts, global-styles.ts)
│       ├── types/                     — Types TypeScript partagés
│       └── utils/                     — Notifications, storage, permissions, app-packages
└── landing/
    ├── index.html                     — Site vitrine + waitlist
    ├── privacy.html                   — Politique de confidentialité publique
    ├── delete-account.html            — Formulaire suppression de compte
    └── api/
        ├── waitlist.js                — Endpoint Vercel — inscription waitlist
        ├── download.js                — Endpoint Vercel — redirection APK
        └── delete-account.js          — Endpoint Vercel — demande suppression
```

---

## Lancer le projet

### Prérequis

- Node.js 18+
- Un projet [Supabase](https://supabase.com/) configuré (voir [docs/supabase-schema.md](docs/supabase-schema.md))
- Android Studio + SDK Android (pour le build local)

### Installation

```bash
cd frontend
npm install
```

### Variables d'environnement

```bash
cp .env.example .env
```

Remplis les valeurs — elles se trouvent dans **Supabase Dashboard → Settings → API** :

```env
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Développement local

```bash
cd frontend
expo start
```

> Les notifications locales et la surveillance d'apps nécessitent un build réel (pas Expo Go).

---

## Build Android (EAS)

```bash
# Installer EAS CLI (une seule fois)
npm install -g eas-cli

# Se connecter à Expo
eas login

# APK de preview — distribution interne, partageable directement
eas build -p android --profile preview

# AAB de production — Play Store
eas build -p android --profile production
```

Le lien de téléchargement APK apparaît à la fin du build (~15 min) et sur [expo.dev](https://expo.dev).

> Les variables d'env doivent être configurées sur EAS avant de builder :
> **expo.dev → projet → Environment variables → preview**

---

## Landing (Vercel)

```bash
cd landing
npm install -g vercel
vercel --prod
```

Variables d'environnement à configurer sur Vercel :
- `RESEND_API_KEY` — clé API Resend
- `WAITLIST_RECIPIENT` — adresse email qui reçoit les notifications d'inscription
- `APK_URL` — lien de téléchargement de l'APK (à mettre à jour après chaque build)

---

## Contextes disponibles

| Contexte | Description |
|----------|-------------|
| Bus | Défis d'observation dans les transports |
| Pause | Mini-activités bien-être pendant une pause |
| Lit | Exercices de pleine conscience au repos |
| Salle d'attente | Jeux d'observation dans un espace public |
| Métro | Défis rapides dans les transports souterrains |
| Maison | Activités simples pour bouger chez soi |
