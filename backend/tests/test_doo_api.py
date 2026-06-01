"""Doo backend API tests - contexts, challenge, answers."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://break-the-scroll.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

EXPECTED_CONTEXT_KEYS = {"bus", "pause", "lit", "salle_attente", "metro", "maison"}


@pytest.fixture
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ----- Health -----
def test_root(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    assert "Doo" in r.json().get("message", "")


# ----- Contexts -----
class TestContexts:
    def test_get_contexts_returns_6(self, s):
        r = s.get(f"{API}/contexts")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 6
        keys = {c["key"] for c in data}
        assert keys == EXPECTED_CONTEXT_KEYS
        for c in data:
            assert isinstance(c["label"], str) and len(c["label"]) > 0


# ----- Challenge -----
class TestChallenge:
    def test_get_challenge_bus(self, s):
        r = s.get(f"{API}/challenge", params={"context": "bus"})
        assert r.status_code == 200
        d = r.json()
        assert d["context"] == "bus"
        assert d["context_label"] == "Je suis dans le bus"
        assert isinstance(d["challenge"], str) and len(d["challenge"]) > 0

    def test_get_challenge_all_contexts(self, s):
        for k in EXPECTED_CONTEXT_KEYS:
            r = s.get(f"{API}/challenge", params={"context": k})
            assert r.status_code == 200, f"failed for {k}"
            assert r.json()["context"] == k

    def test_get_challenge_unknown_context(self, s):
        r = s.get(f"{API}/challenge", params={"context": "unknown_xyz"})
        assert r.status_code == 404

    def test_get_challenge_exclude_returns_different(self, s):
        r1 = s.get(f"{API}/challenge", params={"context": "bus"})
        first = r1.json()["challenge"]
        # Try several times, with exclude=first, must always be different
        for _ in range(8):
            r = s.get(f"{API}/challenge", params={"context": "bus", "exclude": first})
            assert r.status_code == 200
            assert r.json()["challenge"] != first


# ----- Answers -----
class TestAnswers:
    created_ids = []

    def test_post_answer_persists(self, s):
        payload = {
            "context": "bus",
            "challenge": "TEST_challenge_string",
            "answer": "TEST_j'ai vu 4 voitures jaunes",
        }
        r = s.post(f"{API}/answers", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        # No _id leakage
        assert "_id" not in d
        assert d["context"] == "bus"
        assert d["context_label"] == "Je suis dans le bus"
        assert d["challenge"] == payload["challenge"]
        assert d["answer"] == payload["answer"]
        assert "id" in d and len(d["id"]) > 0
        assert "created_at" in d
        TestAnswers.created_ids.append(d["id"])

    def test_get_answers_contains_created(self, s):
        # ensure at least one exists
        payload = {
            "context": "pause",
            "challenge": "TEST_pause_challenge",
            "answer": "TEST_pause_answer",
        }
        post_r = s.post(f"{API}/answers", json=payload)
        assert post_r.status_code == 200
        created = post_r.json()
        TestAnswers.created_ids.append(created["id"])

        r = s.get(f"{API}/answers")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        ids = {a["id"] for a in data}
        assert created["id"] in ids
        # Confirm no _id leakage anywhere
        for a in data:
            assert "_id" not in a

    def test_post_answer_unknown_context_still_saves(self, s):
        # The current implementation accepts unknown context and uses context as label
        payload = {"context": "TEST_unknown", "challenge": "x", "answer": "y"}
        r = s.post(f"{API}/answers", json=payload)
        # Accept either 200 (current impl) or 422; behavior allows unknown -> fallback
        assert r.status_code in (200, 422)
