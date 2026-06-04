# Changelog

## [Unreleased]

### Added

- **Authentification** — écran login/register (`app/auth.tsx`) via Supabase Auth (email + password)
- **Garde de session** — `_layout.tsx` écoute `onAuthStateChange` et redirige vers `/auth` si non connecté, via le hook `use-auth.ts`
- **Client Supabase** — `src/lib/supabase.ts` (singleton) + réécriture complète de `src/api/client.ts` pour remplacer les appels HTTP FastAPI par des requêtes Supabase directes
- **`.env.example`** — template documenté pour les variables `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **EAS Build** — profil `preview` configuré dans `eas.json` pour générer un APK Android installable directement

### Changed

- **Backend** — migration de Python FastAPI + MongoDB vers Supabase (PostgreSQL + Auth + API auto-générée). Le dossier `backend/` a été supprimé.
- **Défis** — la banque de défis hardcodée dans `server.py` est désormais seedée en base de données (`challenges` table), gérables depuis l'interface admin Supabase
- **Réponses** — les réponses sont maintenant liées à un `user_id` (Supabase Auth) et à un `challenge_id` (FK), avec Row Level Security
- **`app.json`** — correction du chemin du splash screen (`splash-icon.png` → `splash-image.png`)
- **`.gitignore`** — ajout d'exceptions `!.env.example` et `!**/.env.example` pour que le template soit versionné

### Removed

- Dossier `backend/` (FastAPI + MongoDB + requirements.txt + tests Python)
- Dossiers `test_reports/` et `tests/` (résidus du scaffold initial)
