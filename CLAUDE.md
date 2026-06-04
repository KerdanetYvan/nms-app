# CLAUDE.md — Doo

Conventions et règles de développement pour le projet Doo.

---

## Stack et contraintes

### Ce qu'on utilise

| Outil | Rôle |
| --- | --- |
| React Native + Expo (Managed Workflow) | Framework mobile iOS + Android |
| TypeScript | Typage strict — pas de JS pur |
| Expo Router | Navigation — routing basé sur les fichiers |
| Supabase | Auth + PostgreSQL + API auto-générée |
| EAS Build | Build et distribution des APKs/IPAs |
| react-native-reanimated | Animations — à préférer à l'API `Animated` native |

### Ce qu'on n'utilise pas

- **Pas de backend custom** — tout passe par Supabase
- **Pas de state manager global** — pas de Redux, Zustand ou Context API pour des données Supabase
- **Pas de lib de composants UI** — pas de NativeWind, Tamagui, Gluestack, etc. Styles maison via `StyleSheet` + `src/theme/global-styles.ts`
- **Pas de code natif custom** — Expo Managed Workflow uniquement, pas d'ejection

---

## Ce qu'il ne faut pas faire

### Règles Supabase

- Ne jamais utiliser la clé `service_role` côté client — uniquement la clé `anon` dans les variables `EXPO_PUBLIC_`
- Ne jamais désactiver RLS sur une table sans raison explicite
- Ne pas créer une nouvelle table sans ajouter ses policies RLS dans la foulée

### Règles Expo

- Ne pas ejecter du Managed Workflow — pas de `expo eject`, pas de dossier `android/` ou `ios/` committé
- Ne pas installer une lib native sans vérifier sa compatibilité Expo au préalable
- Ne pas modifier `app.json` sans vérifier que les fichiers référencés (icône, splash, assets) existent bien

### Règles environnement

- Ne jamais commiter `.env`
- Toute nouvelle variable d'env doit être ajoutée dans `.env.example` avec :
  - Un commentaire décrivant à quoi elle sert
  - Le chemin pour la retrouver (ex: "Supabase Dashboard → Settings → API")
  - Un placeholder indicatif, jamais la vraie valeur
- Toute nouvelle variable d'env doit aussi être configurée sur EAS avant de builder (`eas env:create` ou dashboard expo.dev)

### Règles code

- Ne pas utiliser d'APIs web (`localStorage`, `document`, `window`) — incompatibles React Native
- Ne pas lancer `react-native run-android` — tout passe par `expo start` ou `eas build`

---

## Nommage

| Cible | Convention | Exemple |
| --- | --- | --- |
| Fichiers | `kebab-case` | `use-auth.ts`, `global-styles.ts` |
| Composants React | `PascalCase` | `ChallengeCard`, `AuthScreen` |
| Fonctions | `camelCase` | `getChallenge()`, `saveAnswer()` |
| Variables | `snake_case` | `context_key`, `challenge_text` |
| Constantes | `SNAKE_CASE_MAJUSCULE` | `LIMIT_OPTIONS`, `SCROLL_GUARD_MINUTES` |

---

## Style

- **Jamais de style inline** — tout dans `StyleSheet.create()`, défini en bas du fichier
- **Tokens de design** centralisés dans `src/theme/` :
  - `colors.ts` — couleurs, espacements, rayons
  - `global-styles.ts` — typographie, layout, boutons réutilisables
- Pour tout nouveau style de texte (titre, subtitle, caption...) ou layout (card, container...) : vérifier d'abord si un équivalent existe dans `global-styles.ts` avant d'en créer un nouveau
- Pas de bibliothèque de composants UI externe

---

## TypeScript

- Pas de `any` — typer explicitement
- Cast uniquement si inévitable, avec un commentaire expliquant pourquoi
- Types explicites sur les retours de toutes les fonctions exportées

---

## Conventions Supabase

- Toujours destructurer `{ data, error }` et `throw error` si non-null — ne jamais ignorer silencieusement
- Aucun état client qui duplique des données en base (pas de Redux/Zustand pour du contenu Supabase)
- Les droits d'accès sont gérés par les RLS policies — ne pas les recoder côté client

---

## Navigation

- Expo Router exclusivement — `router.push()` / `router.replace()` et paramètres d'URL
- Pas de navigation impérative custom

---

## DRY

- Créer un composant ou une fonction partagée dès qu'une logique apparaît à **2 endroits ou plus** et que la réutilisation est évidente
- Ne pas abstraire prématurément — quelques lignes similaires dans deux screens ne justifient pas forcément un composant
- Les composants partagés vont dans `src/components/`, les hooks dans `src/hooks/`

---

## Structure du projet

```text
frontend/
├── app/                    — screens Expo Router (un fichier = une route)
│   ├── _layout.tsx         — layout racine, garde de session auth
│   ├── auth.tsx            — login / register
│   ├── onboarding.tsx      — formulaire d'onboarding (première connexion)
│   ├── index.tsx           — accueil, sélection du contexte
│   ├── challenge.tsx       — affichage du défi
│   └── answer.tsx          — saisie de la réponse
├── assets/
│   ├── fonts/              — polices custom
│   └── images/             — icônes, splash, adaptive icon
└── src/
    ├── algorithms/         — logique métier pure (sans UI ni dépendances RN)
    ├── api/                — client Supabase (requêtes vers la BDD)
    ├── components/         — composants React Native réutilisables
    ├── hooks/              — hooks custom (use-auth, use-icon-fonts...)
    ├── lib/                — singletons et clients tiers (supabase.ts)
    ├── theme/              — design tokens (colors.ts, global-styles.ts)
    ├── types/              — types TypeScript partagés (index.ts)
    └── utils/              — fonctions utilitaires (notifications, storage...)
```

**Règles de placement :**

- Un nouvel écran → `app/`
- Un composant utilisé dans 2+ screens → `src/components/`
- Un hook custom → `src/hooks/`
- Un type partagé → `src/types/index.ts`
- Une fonction utilitaire sans UI → `src/utils/`
- De la logique métier pure (algorithmes, calculs, sans dépendances RN) → `src/algorithms/`

---

## Commentaires

- Pas de commentaires qui décrivent ce que le code fait (le code doit se lire seul)
- Commenter uniquement le **pourquoi** quand ce n'est pas évident : workaround Expo, contrainte RLS, comportement inattendu d'une lib

---

## Workflow

### Développement local

```bash
cd frontend
yarn start
```

Toutes les commandes frontend se lancent depuis `frontend/`, jamais depuis la racine du repo.

Les notifications locales ne fonctionnent pas sur Expo Go — il faut un build réel pour les tester.

### Tests

```bash
cd frontend
npm test
```

Jest + ts-jest, configuré dans `jest.config.js`. Les tests couvrent la logique métier pure dans `src/algorithms/`. Les fichiers de test sont colocalisés avec leur module (`generateProgram.test.ts` à côté de `generateProgram.ts`).

### Build APK (Android)

```bash
eas build -p android --profile preview
```

Vérifier avant de lancer :

- Les variables d'env sont configurées sur EAS (dashboard expo.dev → projet → Environment variables → preview)
- `app.json` ne référence que des fichiers qui existent dans `assets/`

### Supabase

- Les tables et modifications de schéma se font dans l'éditeur SQL du dashboard Supabase
- Toute nouvelle table doit avoir ses RLS policies créées dans la même session

### Avant de commiter

- S'assurer qu'aucun `.env` n'est dans le staging (`git status`)
- Si une variable d'env a été ajoutée ou modifiée, mettre à jour `.env.example` en même temps

---

## Commits

Format conventionnel :

```text
feat:     nouvelle fonctionnalité
fix:      correction de bug
refactor: réécriture sans changement de comportement
chore:    maintenance, dépendances, config
docs:     documentation uniquement
```
