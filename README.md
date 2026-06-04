# Doo

**Doo** est une application mobile anti-doomscrolling qui te propose des défis courts et concrets adaptés à ta situation du moment — dans le bus, en pause, dans ton lit, dans la salle d'attente, dans le métro ou à la maison.

Au lieu de scroller sans fin, Doo t'invite à observer, bouger et interagir avec le monde réel autour de toi.

---

## Fonctionnalités

- **Authentification** — Création de compte et connexion par email/mot de passe.
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
    │   ├── _layout.tsx    # Layout racine — garde de session auth
    │   ├── auth.tsx       # Écran login / register
    │   ├── index.tsx      # Accueil — sélection du contexte
    │   ├── challenge.tsx  # Écran du défi
    │   └── answer.tsx     # Écran de réponse
    └── src/
        ├── api/           # Client Supabase (contextes, défis, réponses)
        ├── hooks/         # use-auth, use-icon-fonts, use-permissions
        ├── lib/           # Singleton client Supabase
        ├── theme/         # Couleurs et espacements
        └── utils/         # Stockage local, notifications, permissions
```

---

## Schéma de base de données

```sql
contexts    — les 6 contextes (bus, pause, lit, salle_attente, metro, maison)
challenges  — les défis associés à chaque contexte
answers     — les réponses des utilisateurs (liées à auth.users via user_id)
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
