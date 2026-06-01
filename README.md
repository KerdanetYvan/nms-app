# Doo

**Doo** est une application mobile anti-doomscrolling qui te propose des défis courts et concrets adaptés à ta situation du moment — dans le bus, en pause, dans ton lit, dans la salle d'attente, dans le métro ou à la maison.

Au lieu de scroller sans fin, Doo t'invite à observer, bouger et interagir avec le monde réel autour de toi.

---

## Fonctionnalités

- **Sélection de contexte** — Tu choisis où tu es (bus, métro, lit, maison...) et Doo te propose un défi adapté à cet endroit.
- **Défi aléatoire** — Un défi est tiré au sort parmi une banque de défis prédéfinis. Tu peux en tirer un autre avec le bouton shuffle.
- **Réponse au défi** — Une fois le défi réalisé, tu peux écrire comment ça s'est passé. Tes réponses sont sauvegardées.
- **Protection anti-scroll** — Un gardien de notifications te prévient après X minutes de scroll (configurable : 5, 10, 15, 20, 30 min) pour te rappeler de lever les yeux.

---

## Stack technique

### Frontend
- **React Native** avec [Expo](https://expo.dev/) (Expo Router pour la navigation)
- **TypeScript**
- **react-native-reanimated** pour les animations
- **expo-notifications** pour les notifications locales (protection anti-scroll)
- **expo-haptics** pour les retours haptiques

### Backend
- **Python** avec [FastAPI](https://fastapi.tiangolo.com/)
- **MongoDB** via Motor (driver async)
- **Pydantic** pour la validation des données

### API REST — endpoints principaux

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/contexts` | Liste tous les contextes disponibles |
| `GET` | `/api/challenge?context=bus` | Retourne un défi aléatoire pour un contexte |
| `POST` | `/api/answers` | Sauvegarde la réponse d'un utilisateur |
| `GET` | `/api/answers` | Récupère l'historique des réponses |

---

## Structure du projet

```
doo/
├── backend/
│   ├── server.py          # API FastAPI + logique des défis
│   ├── requirements.txt   # Dépendances Python
│   └── tests/
│       └── test_doo_api.py
└── frontend/
    ├── app/
    │   ├── index.tsx      # Écran d'accueil — sélection du contexte
    │   ├── challenge.tsx  # Écran du défi
    │   └── answer.tsx     # Écran de réponse
    └── src/
        ├── api/           # Client HTTP vers le backend
        ├── theme/         # Couleurs et espacements
        └── utils/         # Stockage local, notifications
```

---

## Lancer le projet

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn server:main --reload
```

> Pense à créer un fichier `.env` avec `MONGO_URL` et `DB_NAME`.

### Frontend

```bash
cd frontend
yarn install
yarn start
```

Scanne le QR code avec l'app **Expo Go** sur ton téléphone, ou lance sur un émulateur avec `yarn android` / `yarn ios`.

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
