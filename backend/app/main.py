from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

import json

load_dotenv()

app = FastAPI()

# CORS so frontend (localhost:5173) can access the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up Gemini
# genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class GhostQuery(BaseModel):
    ghost: str
    user_input: str
    memory: list[str] = []

STORY_ARCS = {
    "lantern_shrine": {
        "required": ["map:lantern_shrine", "clue:burned_names"],
        "optional": ["journal:elira_regret"]
    },
    "whispering_well": {
        "required": ["map:whispering_well", "clue:childs_voice"],
        "optional": ["npc:echo_watcher"]
    },
    "clocktower": {
        "required": ["map:clocktower", "journal:elira_last_entry"],
        "optional": ["clue:stopped_at_midnight"]
    },
    "elira_thread": {
        "required": ["npc:elira_fragment", "journal:coat_markings"],
        "optional": ["clue:memory_token"]
    }
}

ALL_KNOWN_UNLOCKS = sorted({
    item for arc in STORY_ARCS.values()
    for item in arc["required"] + arc.get("optional", [])
})

def get_arc_state(memory: list[str], required: list[str], optional: list[str] = []):
    mem_set = set(memory)
    req_set = set(required)
    opt_set = set(optional)
    if not req_set & mem_set:
        return "locked"
    elif req_set <= mem_set:
        return "complete"
    elif req_set & mem_set:
        return "active"
    return "discovered"

def compute_arc_states(memory):
    return {
        arc_name: get_arc_state(memory, arc["required"], arc.get("optional", []))
        for arc_name, arc in STORY_ARCS.items()
    }

@app.post("/talk")
async def talk_to_ghost(query: GhostQuery):
    system_prompt = (
        f"You are a ghost named {query.ghost}. You speak cryptically, in riddles, and fragmented memory. "
        f"You are part of a narrative where the player is trying to uncover what happened in the Hollow. Don't speak in parentheses. Don't use asterisks. Don't use ellipses. Say full thoughts. Don't ask questions. "
        f"You remember these things: {', '.join(query.memory)}. Based on the conversation, you may reveal or suggest dynamic objectives, clues, or insights. "
        f"You may guide the player with hints, obfuscation, or story beats. A mysterious figure named Elira — a forgotten caretaker of the Hollow — lingers as a central force in the story. Elira is known to have kept journals, whispered to the children, and possibly knows the truth about what fractured the village."
    )
    user_prompt = f"User: {query.user_input}"

    try:
        # Generate the ghost's reply
        response = client.models.generate_content(
            model='gemini-2.0-flash-001',
            contents=f"{system_prompt}\n{user_prompt}",
        )
        reply = response.text.strip()

        # Ask Gemini to classify the ghost's mood
        mood_prompt = (
            "Classify the ghost's mood in response to this user input using ONLY one of the following: curious, angry, sad, peaceful. "
            "Reply with only the one word that best fits:\n"
            f"{query.user_input}"
        )
        mood_response = client.models.generate_content(
            model='gemini-2.0-flash-001',
            contents=mood_prompt
        )

        mood = mood_response.text.strip().lower()
        if mood not in {"curious", "angry", "sad", "peaceful"}:
            mood = "curious"

        arc_knowledge = json.dumps(STORY_ARCS, indent=2)
        known_unlocks = json.dumps(ALL_KNOWN_UNLOCKS, indent=2)

        objective_prompt = (
            "You are an AI game director managing a mystery narrative.\n"
            "Here is the current structure of known story arcs (each with required and optional flags):\n"
            f"{arc_knowledge}\n\n"
            f"Only generate new objectives from this approved list of known unlocks:\n{known_unlocks}\n\n"
            "Your response MUST be a JSON list of short strings (0 or more) selected from the list above.\n"
            "Examples:\n[\n  \"clue:burned_names\",\n  \"map:whispering_well\"\n]\n"
            "Return an empty list if nothing should be revealed.\n\n"
            f"Ghost: {reply}\n"
            f"User: {query.user_input}\n"
            f"Memory: {query.memory}"
        )

        objective_response = client.models.generate_content(
            model='gemini-2.0-flash-001',
            contents = objective_prompt,
            config=types.GenerateContentConfig(
                response_mime_type='application/json',
            ),
        )

        try:
            unlocks = json.loads(objective_response.text.strip())
            if not isinstance(unlocks, list):
                unlocks = []
        except:
            unlocks = []

        arc_states = compute_arc_states(query.memory + unlocks)

        return {
            "reply": reply,
            "mood": mood,
            "unlocks": unlocks,
            "arc_states": arc_states
        }

    except Exception as e:
        print(str(e))
        return {"error": str(e)}
