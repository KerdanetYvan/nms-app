from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ---------------------------------------------------------------------------
# Challenge bank — predefined real-world challenges per location context.
# ---------------------------------------------------------------------------
CONTEXTS = {
    "bus": {
        "label": "Je suis dans le bus",
        "challenges": [
            "Trouve combien de voitures jaunes passent devant toi",
            "Compte le nombre d'arrêts jusqu'à ta destination",
            "Repère 3 personnes qui portent des lunettes",
            "Observe le paysage et trouve 5 enseignes de magasins differentes",
            "Compte combien de personnes montent au prochain arrêt",
            "Trouve une plaque d'immatriculation qui contient le chiffre 7",
        ],
    },
    "pause": {
        "label": "Je suis en pause",
        "challenges": [
            "Bois un grand verre d'eau et étire-toi pendant 30 secondes",
            "Fais 10 respirations profondes les yeux fermés",
            "Écris une chose pour laquelle tu es reconnaissant aujourd'hui",
            "Lève-toi et marche 50 pas",
            "Envoie un message gentil à une personne que tu apprécies",
            "Observe par la fenêtre et décris ce que tu vois en 3 mots",
        ],
    },
    "lit": {
        "label": "Je suis dans mon lit",
        "challenges": [
            "Ferme les yeux et écoute 3 sons différents autour de toi",
            "Pense à 3 bons moments de ta journée",
            "Fais une liste mentale de 5 choses à faire demain",
            "Étire doucement ton corps de la tête aux pieds",
            "Imagine ton endroit préféré dans le monde pendant une minute",
            "Repère combien d'objets bleus il y a dans ta chambre",
        ],
    },
    "salle_attente": {
        "label": "Je suis dans la salle d'attente",
        "challenges": [
            "Compte combien de personnes attendent avec toi",
            "Repère l'objet le plus ancien dans la pièce",
            "Trouve 4 choses de couleur rouge autour de toi",
            "Observe une affiche et retiens 3 informations",
            "Compte combien de fois la porte s'ouvre en 5 minutes",
            "Trouve le motif qui se répète sur le sol ou les murs",
        ],
    },
    "metro": {
        "label": "Je suis dans le métro",
        "challenges": [
            "Compte combien de stations il reste jusqu'à ta sortie",
            "Repère la personne qui lit un vrai livre",
            "Trouve 3 publicités différentes dans la rame",
            "Observe les chaussures des gens et trouve la paire la plus originale",
            "Compte combien de personnes écoutent de la musique",
            "Mémorise le nom de la prochaine station sans regarder à nouveau",
        ],
    },
    "maison": {
        "label": "Je suis à la maison",
        "challenges": [
            "Range 5 objets qui traînent autour de toi",
            "Prépare-toi une boisson chaude et savoure-la lentement",
            "Arrose une plante ou ouvre une fenêtre pour aérer",
            "Appelle un proche pour prendre de ses nouvelles",
            "Trouve un livre et lis la première page",
            "Fais 15 sauts ou une petite danse sur ta chanson préférée",
        ],
    },
}


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class ContextInfo(BaseModel):
    key: str
    label: str


class ChallengeResponse(BaseModel):
    context: str
    context_label: str
    challenge: str


class AnswerCreate(BaseModel):
    context: str
    challenge: str
    answer: str


class AnswerRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    context: str
    context_label: str
    challenge: str
    answer: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "Doo API running"}


@api_router.get("/contexts", response_model=List[ContextInfo])
async def get_contexts():
    return [ContextInfo(key=k, label=v["label"]) for k, v in CONTEXTS.items()]


@api_router.get("/challenge", response_model=ChallengeResponse)
async def get_random_challenge(context: str, exclude: Optional[str] = None):
    ctx = CONTEXTS.get(context)
    if not ctx:
        raise HTTPException(status_code=404, detail="Contexte inconnu")
    pool = [c for c in ctx["challenges"] if c != exclude] or ctx["challenges"]
    challenge = random.choice(pool)
    return ChallengeResponse(context=context, context_label=ctx["label"], challenge=challenge)


@api_router.post("/answers", response_model=AnswerRecord)
async def create_answer(input: AnswerCreate):
    ctx = CONTEXTS.get(input.context)
    label = ctx["label"] if ctx else input.context
    record = AnswerRecord(
        context=input.context,
        context_label=label,
        challenge=input.challenge,
        answer=input.answer,
    )
    await db.answers.insert_one(record.dict())
    return record


@api_router.get("/answers", response_model=List[AnswerRecord])
async def get_answers():
    docs = await db.answers.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return [AnswerRecord(**d) for d in docs]


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.dict())
    await db.status_checks.insert_one(status_obj.dict())
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
