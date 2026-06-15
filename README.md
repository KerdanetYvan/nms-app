# Doo

**Doo** est une application mobile anti-doomscrolling qui te propose des défis courts et concrets adaptés à ta situation du moment — dans le bus, en pause, dans ton lit, dans la salle d'attente, dans le métro ou à la maison.

Au lieu de scroller sans fin, Doo t'invite à observer, bouger et interagir avec le monde réel autour de toi.

---

## Fonctionnalités

- **Landing** — Écran de bienvenue (`app/welcome.tsx`) affiché aux utilisateurs non connectés : logo + boutons "Créer un compte" / "J'ai déjà un compte".
- **Authentification** — Création de compte (Nom, Prénom, Email, Mot de passe avec barre de complexité : 8 car., 2 maj., 2 min., 1 spécial) et connexion par email/mot de passe. Le prénom et nom sont stockés dans `auth.users.raw_user_meta_data`.
- **Confirmation e-mail** — Écran de saisie d'un code OTP reçu par mail (`app/confirm-email.tsx`). Vérification via `supabase.auth.verifyOtp`. Bouton "Renvoyer le code" inclus.
- **Onboarding** — Formulaire 6 étapes lancé automatiquement à la première connexion : raison d'usage, temps d'écran actuel (picker drum-roll), objectif (picker drum-roll), applications chronophages (choix multiple), moments de scroll (choix multiple), niveau de motivation. Le programme généré est sauvegardé en base à la fin du flow.
- **Programme de réduction** — Algorithme personnalisé qui génère un programme hebdomadaire basé sur la courbe d'ancrage d'habitude de Lally (2010) et le modèle B=MAP de Fogg : phase d'introduction (2 semaines), réduction progressive sur courbe sigmoïde, consolidation.
- **Visualisation du programme** — Graphique de progression (courbe Catmull-Rom lissée, aire dégradée, points colorés par phase) avec détail par phase (dates, objectif horaire, description).
- **Sélection de contexte** — Tu choisis où tu es (bus, métro, lit, maison...) et Doo te propose un défi adapté.
- **Défi aléatoire** — Un défi est tiré au sort parmi la banque de défis en base. Bouton shuffle pour en piocher un autre.
- **Réponse au défi** — Une fois le défi réalisé, tu peux écrire comment ça s'est passé. Les réponses sont sauvegardées et liées à ton compte.
- **Profil** — Avatar, nom, email, accès aux paramètres et aux informations personnelles (`app/profile.tsx`).
- **Paramètres** — Notifications, informations personnelles, pages légales, déconnexion (`app/settings.tsx`).
- **Informations personnelles** — Édition du prénom, nom, date de naissance et numéro de téléphone (`app/personal-info.tsx`).
- **Notifications** — Activation/désactivation des rappels avec sélection de l'heure (`app/notifications-settings.tsx`).
- **Pages légales** — Politique de confidentialité RGPD (`app/privacy.tsx`) et conditions d'utilisation (`app/terms.tsx`) accessibles depuis les paramètres.

---

## Stack technique

### Frontend
- **React Native** avec [Expo](https://expo.dev/) (Expo Router pour la navigation)
- **TypeScript**
- **react-native-reanimated** — animations
- **react-native-svg** — rendu du graphique de progression
- **@expo-google-fonts/quicksand** — police Quicksand (labels, titres)
- **expo-notifications** — notifications locales (protection anti-scroll)
- **expo-haptics** — retours haptiques

### Backend

- **[Supabase](https://supabase.com/)** — Auth + PostgreSQL + API auto-générée
  - Authentification email/password via Supabase Auth
  - Base de données PostgreSQL avec Row Level Security
  - Accès direct depuis le client via `@supabase/supabase-js`

---

## Structure du projet

```
doo/
├── frontend/
│   ├── app/
│   │   ├── _layout.tsx               # Layout racine — garde de session auth
│   │   ├── welcome.tsx               # Landing — écran d'accueil non connecté
│   │   ├── auth.tsx                  # Écran login / register
│   │   ├── confirm-email.tsx         # Saisie du code OTP de confirmation e-mail
│   │   ├── onboarding.tsx            # Formulaire d'onboarding 6 étapes
│   │   ├── index.tsx                 # Accueil — sélection du contexte
│   │   ├── program.tsx               # Visualisation du programme de réduction
│   │   ├── challenge.tsx             # Écran du défi
│   │   ├── answer.tsx                # Écran de réponse
│   │   ├── profile.tsx               # Profil utilisateur
│   │   ├── settings.tsx              # Paramètres
│   │   ├── personal-info.tsx         # Édition des informations personnelles
│   │   ├── notifications-settings.tsx# Paramètres de notifications
│   │   ├── privacy.tsx               # Politique de confidentialité
│   │   └── terms.tsx                 # Conditions d'utilisation
│   └── src/
│       ├── algorithms/               # Logique métier pure : generateProgram
│       ├── api/                      # Client Supabase (contextes, défis, réponses, profil)
│       ├── components/               # Composants réutilisables (BottomNav, DooLogo, EyesLogo)
│       ├── hooks/                    # use-auth, use-icon-fonts, use-permissions
│       ├── lib/                      # Singleton client Supabase
│       ├── theme/                    # Couleurs et espacements
│       ├── types/                    # Types TypeScript partagés
│       └── utils/                    # Stockage local, notifications, permissions
└── landing/
    ├── index.html                    # Site vitrine + waitlist
    ├── privacy.html                  # Politique de confidentialité publique
    ├── delete-account.html           # Formulaire de demande de suppression de compte
    └── api/
        ├── waitlist.js               # Endpoint Vercel — inscription waitlist (Resend)
        └── delete-account.js         # Endpoint Vercel — demande suppression (Resend)
```

---

## Schéma de base de données

```sql
contexts      — les 6 contextes (bus, pause, lit, salle_attente, metro, maison)
challenges    — les défis associés à chaque contexte
answers       — les réponses des utilisateurs (liées à auth.users via user_id)
user_profiles — profil de réduction (screen_time_min, target_time_min, motivation,
                reason, apps text[], scroll_moments text[], programme)
```

---

## Lancer le projet

### Prérequis

- Node.js 18+
- Un projet [Supabase](https://supabase.com/) configuré (schéma + seed + RLS)

### Installation

```bash
cd frontend
npm install
```

### Variables d'environnement

Copie `.env.example` en `.env` et remplis les valeurs :

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Ces valeurs se trouvent dans **Supabase Dashboard → Settings → API**.

### Démarrer en développement

```bash
expo start
```

Scanne le QR code avec l'app **Expo Go**, ou lance sur émulateur avec `expo start --android` / `expo start --ios`.

---

## Build Android

```bash
# Installer EAS CLI
npm install -g eas-cli

# Se connecter à Expo
eas login

# APK de preview (distribution interne)
eas build -p android --profile preview

# AAB de production (Play Store)
eas build -p android --profile production
```

Le lien de téléchargement est fourni à la fin du build (~15 min).

> Les variables d'env doivent être configurées sur EAS avant de builder :
> **expo.dev → projet → Environment variables**

## Landing (Vercel)

```bash
cd landing
npm install -g vercel
vercel --prod
```

Variables d'environnement à configurer sur Vercel :
- `RESEND_API_KEY` — clé API Resend
- `WAITLIST_RECIPIENT` — adresse email qui reçoit les notifications
- `BETA_LINK` — lien de téléchargement de l'APK bêta

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
