from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from collections import defaultdict
import json
import re

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class GhostQuery(BaseModel):
    ghost: str
    user_input: str
    memory: list[str] = []
    session_id: str
    dialogue_history: list[str] = []

def get_initial_story_arcs():
    return {
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

SESSION_ARCS = defaultdict(get_initial_story_arcs)
SESSION_UNLOCKS = defaultdict(lambda: set())

UNLOCK_DESCRIPTIONS = {
    "map:lantern_shrine": "a hidden shrine where lanterns once burned to protect the village",
    "map:whispering_well": "a fog-covered well said to echo with children's voices",
    "map:clocktower": "the broken clocktower where time stopped at midnight",
    "clue:burned_names": "a charred list of names found near the lantern shrine",
    "clue:childs_voice": "a faint voice heard beneath the well",
    "clue:stopped_at_midnight": "evidence the clocktower froze at a significant moment",
    "journal:elira_regret": "a journal entry where Elira expresses deep regret",
    "journal:elira_last_entry": "Elira's final journal entry before she vanished",
    "journal:coat_markings": "sketches of mysterious markings hidden inside a coat",
    "clue:memory_token": "a small artifact that stores a piece of Elira's memory",
    "npc:echo_watcher": "a ghostly observer who listens but does not speak",
    "npc:elira_fragment": "a spectral fragment of Elira, flickering between worlds"
}

def get_arc_state(memory, required, optional=[]):
    mem_set = set(memory)
    req_set = set(required)
    if not req_set & mem_set:
        return "locked"
    elif req_set <= mem_set:
        return "complete"
    elif req_set & mem_set:
        return "active"
    return "discovered"

def compute_arc_states(memory, story_arcs):
    return {
        arc_name: get_arc_state(memory, arc["required"], arc.get("optional", []))
        for arc_name, arc in story_arcs.items()
    }

def extract_json_object(text: str):
    try:
        return json.loads(text)
    except:
        match = re.search(r'{.*}', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except:
                return {}
        return {}

@app.post("/talk")
async def talk_to_ghost(query: GhostQuery):
    session_id = query.session_id
    if not session_id:
        return {"error": "Missing session_id"}

    STORY_ARCS = SESSION_ARCS[session_id]
    ALL_KNOWN_UNLOCKS = SESSION_UNLOCKS[session_id]

    conversation_history = "\n".join(query.dialogue_history[-5:])
    discoveries = [m for m in query.memory if ':' in m]
    questions = [m for m in query.memory if ':' not in m]

    discovery_text = (
        "You've helped uncover fragments like: " +
        ", ".join(UNLOCK_DESCRIPTIONS.get(m, m) for m in discoveries)
        if discoveries else "You have not yet uncovered much."
    )
    question_text = (
        "The player has asked questions such as: " + "; ".join(questions)
        if questions else ""
    )

    guidance_block = (
        "Use your knowledge of the player's discoveries to shape your response.\n\n"
        "- If a location has been found, you may describe what happened there or suggest returning.\n"
        "- If a clue or journal has been found, you may hint at what it reveals.\n"
        "- If an NPC has been encountered, you may reference their presence or guidance.\n"
        "- If a mystery remains, you may suggest where to look next.\n\n"
        "Speak naturally. Do not use unlock codes. Do not write in monologue form."
    )

    system_prompt = f"""
You are a ghost named {query.ghost}, lingering in a forgotten place known as the Hollow.

You remember fragments of your life and the people who once lived here. You try to help the living uncover the truth of what happened. Speak with a tone that is haunted, poetic, and emotionally rich — but avoid being too cryptic. Make your words readable and human. No asterisks, ellipses, parentheticals, or overly fragmented sentences.

A mysterious figure named Elira is central to the story. She was a caretaker of the Hollow. You may remember her fondly, fear her, or mourn her. Her journals, her whispers to the children, and her disappearance are tied to the unraveling mystery.

Use the recent conversation to ground your response:

{conversation_history}

{guidance_block}

{discovery_text}
{question_text}

Respond directly to the player's last message below. 
Limit your reply to no more than 3–4 sentences. 
Keep it mysterious but readable. Avoid long monologues. Speak clearly, with poetic restraint.

Message: {query.user_input}
"""

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash-001',
            contents=system_prompt,
        )
        reply = response.text.strip()

        mood_prompt = (
            "Classify the ghost's mood in response to this user input using ONLY one of the following: curious, angry, sad, peaceful.\n"
            f"Reply with only the one word that best fits:\n{query.user_input}"
        )
        mood_response = client.models.generate_content(
            model='gemini-2.0-flash-001',
            contents=mood_prompt
        )
        mood = mood_response.text.strip().lower()
        if mood not in {"curious", "angry", "sad", "peaceful"}:
            mood = "curious"

        arc_knowledge = json.dumps(STORY_ARCS, indent=2)
        known_unlocks = json.dumps(sorted(ALL_KNOWN_UNLOCKS), indent=2)

        new_arc_allowed = len(STORY_ARCS) < 5
        dynamic_arc_instruction = (
            "You may define ONE new story arc if and only if there are fewer than 5 total story arcs.\n"
            "It must contain only ONE required item, and that item must be a new map location unlock from the form 'map:location_id'.\n"
            "Example structure:\n"
            "{ \"key\": \"mist_bridge\", \"label\": \"Mist Bridge\", \"required\": [\"map:mist_bridge\"] }"
            if new_arc_allowed else ""
        )

        objective_prompt = (
            "You are an AI game director managing a mystery narrative.\n"
            "Generate a JSON object with two keys:\n"
            "1. 'unlocks': a list of short strings selected only from the known unlock list.\n"
            "2. 'new_arc': optional new arc definition as described below.\n\n"
            f"{dynamic_arc_instruction}\n\n"
            f"Known unlocks:\n{known_unlocks}\n\n"
            f"Current arcs:\n{arc_knowledge}\n\n"
            f"Ghost: {reply}\nUser: {query.user_input}\nMemory: {query.memory}"
        )

        objective_response = client.models.generate_content(
            model='gemini-2.0-flash-001',
            contents=objective_prompt,
            config=types.GenerateContentConfig(response_mime_type='application/json'),
        )

        response_data = extract_json_object(objective_response.text.strip())
        unlocks = response_data.get("unlocks", [])
        
        if not isinstance(unlocks, list):
            unlocks = []

        new_arc = response_data.get("new_arc")
        if new_arc:
            arc_key = new_arc.get("key")
            required = new_arc.get("required", [])
            if arc_key and arc_key not in STORY_ARCS and isinstance(required, list):
                STORY_ARCS[arc_key] = {
                    "required": required,
                    "optional": []
                }
                ALL_KNOWN_UNLOCKS.update(required)
                label = new_arc.get("label", arc_key.replace("_", " ").title())
                for unlock_id in required:
                    if unlock_id.startswith("map:") and unlock_id not in UNLOCK_DESCRIPTIONS:
                        UNLOCK_DESCRIPTIONS[unlock_id] = f"a location known as {label}, rumored to hold secrets of the Hollow"

        arc_states = compute_arc_states(query.memory + unlocks, STORY_ARCS)

        return {
            "reply": reply,
            "mood": mood,
            "unlocks": unlocks,
            "arc_states": arc_states
        }

    except Exception as e:
        print(str(e))
        return {"error": str(e)}
