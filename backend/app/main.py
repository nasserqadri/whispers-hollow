from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import google.generativeai as genai
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
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

class GhostQuery(BaseModel):
    ghost: str
    user_input: str
    memory: list[str] = []

@app.post("/talk")
async def talk_to_ghost(query: GhostQuery):
    system_prompt = (
        f"You are a ghost named {query.ghost}. You speak cryptically, sometimes in riddles, and fragmented memory. "
        f"You are part of a narrative where the player is trying to uncover what happened in the Hollow. "
        f"You remember these things: {', '.join(query.memory)}. Based on the conversation, you may reveal or suggest dynamic objectives, clues, or insights. "
        f"You may guide the player with hints, obfuscation, or story beats."
    )
    user_prompt = f"User: {query.user_input}"

    try:
        # Generate the ghost's reply
        response = model.generate_content(f"{system_prompt}\n{user_prompt}")
        reply = response.text.strip()

        # Ask Gemini to classify the ghost's mood
        mood_prompt = (
            "Classify the ghost's mood in response to this user input using ONLY one of the following: curious, angry, sad, peaceful. "
            "Reply with only the one word that best fits:\n"
            f"{query.user_input}"
        )
        mood_response = model.generate_content(mood_prompt)
        mood = mood_response.text.strip().lower()
        if mood not in {"curious", "angry", "sad", "peaceful"}:
            mood = "curious"

        # Ask Gemini to dynamically generate micro-objectives or story changes
        objective_prompt = (
            "You are an AI game director managing a mystery narrative. "
            "Based on the ghost's reply and the ongoing memory, suggest dynamic micro-objectives or world updates that the player might now pursue.\n"
            "Your response MUST be a JSON list of short strings. Each item represents a clue, location, story beat, or new character.\n"
            "Only include actionable ideas, and be creative and narratively consistent.\n"
            "Examples:\n"
            "[\n  \"clue:old_lantern_found\",\n  \"map:forgotten_cellar\",\n  \"npc:brother_salt\",\n  \"journal:wellmother_dream\"\n]\n"
            "Return an empty list if nothing should be revealed right now.\n\n"
            f"Ghost: {reply}\n"
            f"User: {query.user_input}\n"
            f"Memory: {query.memory}"
        )
        objective_response = model.generate_content(objective_prompt)

        print(objective_response.text.strip())

        try:
            unlocks = json.loads(objective_response.text.strip())
            if not isinstance(unlocks, list):
                unlocks = []
        except:
            unlocks = []

        return {
            "reply": reply,
            "mood": mood,
            "unlocks": unlocks
        }

    except Exception as e:
        print(str(e))
        return {"error": str(e)}
