# Doo — PRD

## Vision
Application mobile anti-doomscrolling. Quand l'utilisateur scrolle trop longtemps, Doo le rappelle à l'ordre via une notification locale et lui propose des défis du monde réel adaptés à son lieu.

## Stack
- Frontend: Expo (expo-router), React Native, react-native-reanimated, expo-notifications, react-native-keyboard-controller
- Backend: FastAPI + MongoDB (motor)

## Fonctionnalités livrées (MVP)
1. **Écran 1 — Accueil** : titre "Doo", sous-titre "Salut ! Que se passe t-il autour de toi ?", 6 boutons contextuels colorés (bus, pause, lit, salle d'attente, métro, maison) avec icônes.
2. **Écran 2 — Défi** : défi aléatoire chargé depuis le backend selon le contexte, bouton "Commencer le défi !", bouton shuffle pour changer de défi.
3. **Écran 3 — Réponse** : carte jaune "Donner ma réponse", champ texte, "Valider ma réponse" (sauvegarde en base), lien "Retour au défi ->", carte succès "Bravo !".
4. **Protection anti-scroll** : modale (icône bouclier) avec **limite de temps configurable** (5/10/15/20/30/45/60 min), notification locale planifiée + bouton de test. Tap sur la notif ouvre l'accueil.
5. **Historique** : réponses sauvegardées en MongoDB.

## API
- GET /api/contexts
- GET /api/challenge?context=&exclude=
- POST /api/answers
- GET /api/answers

## Limites connues
- La surveillance du temps d'écran des autres apps (TikTok/Reels) nécessite des permissions natives Android (Usage Stats/Accessibilité) indisponibles dans Expo Go. Équivalent fonctionnel: minuteur + notification locale (testable sur build réel).
- Les notifications locales ne se déclenchent pas sur Expo Go (SDK 53+) / web — nécessitent un build de développement/production.

## Idées futures
- Statistiques de défis complétés, séries (streaks), partage social des défis.
