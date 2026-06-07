# Changelog

## [Unreleased]

### Added

- **Onboarding** — écran 3 étapes (`app/onboarding.tsx`) : temps d'écran actuel, objectif, niveau de motivation. Lancé automatiquement à la première connexion, redirige vers le programme à la fin.
- **Algorithme `generateProgram`** (`src/algorithms/generateProgram.ts`) — génère un programme hebdomadaire de réduction basé sur la courbe asymptotique de Lally (2010) et le modèle B=MAP de Fogg (2009). Trois phases : introduction (2 semaines à demi-rythme), réduction progressive sur sigmoid normalisée, consolidation. Tests unitaires colocalisés (`generateProgram.test.ts`).
- **Écran programme** (`app/program.tsx`) — graphique de progression SVG (courbe Catmull-Rom lissée, aire dégradée, points colorés par phase, axe Y en heures, axe X en semaines) + carte de synthèse + détail par phase (dates, objectif horaire, description scientifique).
- **Accès au programme depuis l'accueil** — icône `bar-chart` en haut à gauche de `index.tsx`.
- **`react-native-svg`** — ajouté pour le rendu du graphique (compatible Expo Managed Workflow, SDK 54).
- **`user_profiles`** — table Supabase pour stocker le profil de réduction (`screen_time_min`, `target_time_min`, `motivation`). Méthodes `getUserProfile` et `saveUserProfile` ajoutées dans `src/api/client.ts`.
- **Authentification** — écran login/register (`app/auth.tsx`) via Supabase Auth (email + password).
- **Garde de session** — `_layout.tsx` écoute `onAuthStateChange` et redirige vers `/auth` si non connecté, via le hook `use-auth.ts`.
- **Client Supabase** — `src/lib/supabase.ts` (singleton) + réécriture complète de `src/api/client.ts` pour remplacer les appels HTTP FastAPI par des requêtes Supabase directes.
- **`.env.example`** — template documenté pour les variables `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- **EAS Build** — profil `preview` configuré dans `eas.json` pour générer un APK Android installable directement.

### Fixed

- **`generateProgram` — sigmoid non normalisée** : `progress` partait de 0 (sigmoid(-5) ≈ 0.007, première semaine de phase 2 quasi-identique à la phase 1) et n'atteignait jamais 1 (dernière semaine de phase 2 n'atteignait pas l'objectif → snap visible à la consolidation). Corrigé en normalisant la sigmoid sur [0,1] et en faisant partir `progress` de `1/N` jusqu'à `1`.
- **`generateProgram` — pic de réduction trop élevé** : sigmoid scale 10 → 6 réduit le pic hebdomadaire de ~2.5× à ~1.85× le rythme moyen. `phase2Weeks` contraint à `max(4, ceil(...))` pour éviter les pics extrêmes sur les courts programmes.
- **`saveUserProfile`** — `insert` remplacé par `upsert` sur `user_id` pour éviter un crash si le profil existe déjà.
- **Courbe du graphique** — lissage bézier à tangentes horizontales remplacé par Catmull-Rom (alpha=1/6) pour des tangentes alignées sur la direction réelle de la courbe.

### Changed

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
