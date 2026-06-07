# Doo

**Doo** est une application mobile anti-doomscrolling qui te propose des défis courts et concrets adaptés à ta situation du moment — dans le bus, en pause, dans ton lit, dans la salle d'attente, dans le métro ou à la maison.

Au lieu de scroller sans fin, Doo t'invite à observer, bouger et interagir avec le monde réel autour de toi.

---

## Fonctionnalités

- **Landing** — Écran de bienvenue (`app/welcome.tsx`) affiché aux utilisateurs non connectés : logo + boutons "Créer un compte" / "J'ai déjà un compte".
- **Authentification** — Création de compte (Prénom, Nom, Email, Mot de passe avec barre de complexité : 8 car., 2 maj., 2 min., 1 spécial) et connexion par email/mot de passe. Le prénom et nom sont stockés dans `auth.users.raw_user_meta_data`.
- **Onboarding** — Formulaire 6 étapes lancé automatiquement à la première connexion : raison d'usage, temps d'écran actuel, objectif, applications chronophages (choix multiple), moments de scroll (choix multiple), niveau de motivation.
- **Programme de réduction** — Algorithme personnalisé qui génère un programme hebdomadaire basé sur la courbe d'ancrage d'habitude de Lally (2010) et le modèle B=MAP de Fogg : phase d'introduction (2 semaines), réduction progressive sur courbe sigmoïde, consolidation.
- **Visualisation du programme** — Graphique de progression (courbe Catmull-Rom lissée, aire dégradée, points colorés par phase) avec détail par phase (dates, objectif horaire, description).
- **Sélection de contexte** — Tu choisis où tu es (bus, métro, lit, maison...) et Doo te propose un défi adapté.
- **Défi aléatoire** — Un défi est tiré au sort parmi la banque de défis en base. Bouton shuffle pour en piocher un autre.
- **Réponse au défi** — Une fois le défi réalisé, tu peux écrire comment ça s'est passé. Les réponses sont sauvegardées et liées à ton compte.
- **Protection anti-scroll** — Un gardien de notifications te prévient après X minutes de scroll (configurable : 5 à 60 min) pour te rappeler de lever les yeux.

---

## Stack technique

### Frontend
- **React Native** avec [Expo](https://expo.dev/) (Expo Router pour la navigation)
- **TypeScript**
- **react-native-reanimated** — animations
- **react-native-svg** — rendu du graphique de progression
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
└── frontend/
    ├── app/
    │   ├── _layout.tsx      # Layout racine — garde de session auth
    │   ├── welcome.tsx      # Landing — écran d'accueil non connecté
    │   ├── auth.tsx         # Écran login / register
    │   ├── onboarding.tsx   # Formulaire d'onboarding 6 étapes (première connexion)
    │   ├── index.tsx        # Accueil — sélection du contexte
    │   ├── program.tsx      # Visualisation du programme de réduction
    │   ├── challenge.tsx    # Écran du défi
    │   └── answer.tsx       # Écran de réponse
    └── src/
        ├── algorithms/      # Logique métier pure : generateProgram, handleRelapse
        ├── api/             # Client Supabase (contextes, défis, réponses, profil)
        ├── hooks/           # use-auth, use-icon-fonts, use-permissions
        ├── lib/             # Singleton client Supabase
        ├── theme/           # Couleurs et espacements
        ├── types/           # Types TypeScript partagés
        └── utils/           # Stockage local, notifications, permissions
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
- Yarn
- Un projet [Supabase](https://supabase.com/) configuré (schéma + seed + RLS)

### Installation

```bash
cd frontend
yarn install
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
yarn start
```

Scanne le QR code avec l'app **Expo Go**, ou lance sur émulateur avec `yarn android` / `yarn ios`.

---

## Build APK (Android)

```bash
# Installer EAS CLI
npm install -g eas-cli

# Se connecter à Expo
eas login

# Builder un APK de preview
eas build -p android --profile preview
```

Le lien de téléchargement de l'APK est fourni à la fin du build (~15 min).

> Les variables d'env doivent aussi être configurées sur EAS :
> **expo.dev → projet → Environment variables → preview**

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
