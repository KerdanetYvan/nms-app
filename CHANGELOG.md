# Changelog

## [Unreleased]

### Added

- **Confirmation e-mail OTP** (`app/confirm-email.tsx`) — nouvel écran affiché après inscription : saisie du code à N chiffres reçu par mail, appel `supabase.auth.verifyOtp`, bouton "Renvoyer le code" (`supabase.auth.resend`). Gestion du collé (paste) et auto-focus case par case.
- **Police Quicksand** — `@expo-google-fonts/quicksand` chargée dans `_layout.tsx` (`Quicksand_400Regular`, `Quicksand_700Bold`). Utilisée sur les labels de formulaire dans `auth.tsx`.
- **Picker drum-roll** (`onboarding.tsx`, steps 1 & 2) — remplace les inputs texte pour la saisie du temps d'écran et de l'objectif. Deux colonnes `ScrollView` snappées verticalement (heures / période : jour, semaine, mois). Sélection automatique de la valeur centrée. Conversion en minutes/jour via `to_minutes_per_day` avant sauvegarde.
- **Animation de sélection du picker** — chaque item anime son `fontSize` (13 → 18) et sa `color` (#C2BAC0 → textPlum) via `useSharedValue` + `withTiming` (180 ms) de reanimated.

### Fixed

- **Picker drum-roll — scroll lent sans momentum** — `onMomentumScrollEnd` ne se déclenche pas sur Android quand l'utilisateur relâche sans "flick". Ajout d'un fallback `onScrollEndDrag` avec timer (60 ms) annulé par `onMomentumScrollBegin` si le momentum démarre quand même.

### Changed

- **`app/welcome.tsx`** — les deux boutons ("Créer un compte" / "J'ai déjà un compte") utilisent désormais le même style `btnPrimary` (fond mauve, texte blanc).
- **`app/auth.tsx`** — champs register réordonnés (Nom avant Prénom) ; labels en Quicksand 400, noir `#000000`, sans gras, première lettre majuscule. Après inscription, redirige vers `/confirm-email` au lieu de `/`.
- **`app/onboarding.tsx`** — boutons d'options : non sélectionné = fond blanc + bordure et texte colorés ; sélectionné = fond coloré + texte blanc ou sombre selon luminance (`contrasting_text`).
- **`app/_layout.tsx`** — `confirm-email` ajouté aux routes publiques (pas de redirection auth) ; splash screen attend le chargement de Quicksand.

## [0.2.0] — UI & auth flow

### Added

- **Écran landing** (`app/welcome.tsx`) — page d'accueil pour les utilisateurs non connectés : logo + boutons "Créer un compte" et "J'ai déjà un compte" qui pré-remplissent le mode du formulaire auth via paramètre URL (`?mode=register` / `?mode=login`).
- **Champs register étendus** (`app/auth.tsx`) — ajout des champs Prénom et Nom (stockés dans `auth.users.raw_user_meta_data`), suppression du champ confirmation du mot de passe.
- **Barre de complexité du mot de passe** — validation en temps réel (8 car. min., 2 maj., 2 min., 1 spécial) avec barre 4 segments rouge → orange → jaune → vert et critères ✓/✗ affichés en permanence.
- **Onboarding 6 étapes** — ajout de trois nouvelles étapes : "Pourquoi télécharges-tu Doo ?" (choix unique), "Sur quelles apps tu perds le plus de temps ?" (choix multiple), "Quand as-tu tendance à scroller ?" (choix multiple). Données sauvegardées dans les colonnes `reason`, `apps`, `scroll_moments` de `user_profiles`.
- **Logo `logo_doo.png`** (`assets/images/logo_doo.png`) — utilisé sur les écrans welcome, auth et onboarding à la place du texte "Doo".
- **Migration Supabase** — `ALTER TABLE user_profiles ADD COLUMN reason text, ADD COLUMN apps text[] DEFAULT '{}', ADD COLUMN scroll_moments text[] DEFAULT '{}'`.
- **Onboarding** — écran initial (`app/onboarding.tsx`) : temps d'écran actuel, objectif, niveau de motivation. Lancé automatiquement à la première connexion, redirige vers le programme à la fin.
- **Algorithme `generateProgram`** (`src/algorithms/generateProgram.ts`) — génère un programme hebdomadaire de réduction basé sur la courbe asymptotique de Lally (2010) et le modèle B=MAP de Fogg (2009). Trois phases : introduction (2 semaines à demi-rythme), réduction progressive sur sigmoid normalisée, consolidation. Tests unitaires colocalisés (`generateProgram.test.ts`).
- **Écran programme** (`app/program.tsx`) — graphique de progression SVG (courbe Catmull-Rom lissée, aire dégradée, points colorés par phase, axe Y en heures, axe X en semaines) + carte de synthèse + détail par phase (dates, objectif horaire, description scientifique).
- **Accès au programme depuis l'accueil** — icône `bar-chart` en haut à gauche de `index.tsx`.
- **`react-native-svg`** — ajouté pour le rendu du graphique (compatible Expo Managed Workflow, SDK 54).
- **`user_profiles`** — table Supabase pour stocker le profil de réduction (`screen_time_min`, `target_time_min`, `motivation`). Méthodes `getUserProfile` et `saveUserProfile` ajoutées dans `src/api/client.ts`.
- **Authentification** — écran login/register (`app/auth.tsx`) via Supabase Auth (email + password).
- **Garde de session** — `_layout.tsx` écoute `onAuthStateChange` et redirige vers `/welcome` si non connecté, via le hook `use-auth.ts`.
- **Client Supabase** — `src/lib/supabase.ts` (singleton) + réécriture complète de `src/api/client.ts` pour remplacer les appels HTTP FastAPI par des requêtes Supabase directes.
- **`.env.example`** — template documenté pour les variables `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- **EAS Build** — profil `preview` configuré dans `eas.json` pour générer un APK Android installable directement.

### Fixed

- **`generateProgram` — sigmoid non normalisée** : `progress` partait de 0 (sigmoid(-5) ≈ 0.007, première semaine de phase 2 quasi-identique à la phase 1) et n'atteignait jamais 1 (dernière semaine de phase 2 n'atteignait pas l'objectif → snap visible à la consolidation). Corrigé en normalisant la sigmoid sur [0,1] et en faisant partir `progress` de `1/N` jusqu'à `1`.
- **`generateProgram` — pic de réduction trop élevé** : sigmoid scale 10 → 6 réduit le pic hebdomadaire de ~2.5× à ~1.85× le rythme moyen. `phase2Weeks` contraint à `max(4, ceil(...))` pour éviter les pics extrêmes sur les courts programmes.
- **`saveUserProfile`** — `insert` remplacé par `upsert` sur `user_id` pour éviter un crash si le profil existe déjà.
- **Courbe du graphique** — lissage bézier à tangentes horizontales remplacé par Catmull-Rom (alpha=1/6) pour des tangentes alignées sur la direction réelle de la courbe.

### Changed

- **`_layout.tsx`** — redirige les non-connectés vers `/welcome` au lieu de `/auth` ; les écrans `/welcome` et `/auth` sont tous les deux considérés comme publics.
- **`app/auth.tsx`** — logo image à la place du texte, formulaires sans card, mode initialisé depuis le paramètre URL, icône œil pour afficher/masquer le mot de passe.
- **`app/onboarding.tsx`** — logo image, sans card wrapper, boutons d'options visuellement cohérents avec la home (fonds colorés, shadow, bordure de sélection), inputs transparents avec bordure `#7A6678`, `KeyboardAvoidingView` pour les étapes avec saisie clavier.
- **`UserProfile`** (`src/types/index.ts`) — ajout des champs optionnels `reason`, `apps`, `scroll_moments`.
- **Phase 1 (intro)** — étendue de 1 à 2 semaines au même niveau cible (Lally : résistance maximale en début de programme, 1 semaine insuffisante pour installer l'adaptation initiale).
- **Consolidation** — réduite de 4 à 3 semaines (Lally : minimum 18 jours ; 4 semaines + dernière semaine de phase 2 au même niveau créait visuellement un plateau de 5 semaines).
- **`tsconfig.json`** — ajout de `"types": ["jest"]` pour que l'IDE reconnaisse les globals Jest sans erreurs TypeScript.
- **Backend** — migration de Python FastAPI + MongoDB vers Supabase (PostgreSQL + Auth + API auto-générée). Le dossier `backend/` a été supprimé.
- **Défis** — la banque de défis hardcodée dans `server.py` est désormais seedée en base de données (`challenges` table), gérables depuis l'interface admin Supabase.
- **Réponses** — les réponses sont maintenant liées à un `user_id` (Supabase Auth) et à un `challenge_id` (FK), avec Row Level Security.
- **`app.json`** — correction du chemin du splash screen (`splash-icon.png` → `splash-image.png`).
- **`.gitignore`** — ajout d'exceptions `!.env.example` et `!**/.env.example` pour que le template soit versionné.

### Removed

- Dossier `backend/` (FastAPI + MongoDB + requirements.txt + tests Python).
- Dossiers `test_reports/` et `tests/` (résidus du scaffold initial).
