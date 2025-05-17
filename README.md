# Whispers of the Hollow

<p align="center">
  <img src="https://github.com/nasserqadri/whispers-hollow/raw/main/frontend/public/images/ghost_intro.png" alt="Lantern Ghost" width="160" />
</p>

**Whispers of the Hollow** is an AI-powered mystery exploration engine that weaves living stories through haunted dialogue and evolving objectives.  
Everything marked with this icon  
<img src="https://github.com/nasserqadri/whispers-hollow/raw/main/frontend/public/images/ai_wand.png" alt="AI Wand" width="28" style="vertical-align:middle" />  
is AI-generated.

---

## Core Themes

- Interactive and adaptive storytelling driven by LLMs  
- Branching discovery: locations, lore, and characters evolve dynamically  
- Emotional resonance: sadness, fear, hope — all modulated by player interactions
- Living map: the world unfolds as you speak, for your own story

---

## Includes

- 🤖 AI-generated dialogue and follow-up questions  
- 🗺️ AI-generated story arcs, map items, and objectives  
- 🎵 AI-based mood detection that triggers dynamic music and visual effects  
- 🎼 AI-generated music via [Riffusion](https://www.riffusion.com/)  
- 🎨 AI-generated images and map using Gemini + DALL·E  

---

## Does Not Include

- 🚫 Actual game mechanics or movement  
- 🚫 Combat, inventory, or win/lose states  

---

## 🪄 AI Icon Legend

<p>
  <img src="https://github.com/nasserqadri/whispers-hollow/raw/main/frontend/public/images/ai_wand.png" alt="AI Wand" width="40" style="vertical-align:middle" />
  = AI-generated content
</p>

---

## ⚙️ Tech Stack

- [GitHub Repository](https://github.com/nasserqadri/whispers-hollow)
- **LLM**: Google Gemini (via API)  
- **Frontend**: React + Tailwind CSS  
- **Backend**: Python + FastAPI (async)  
- **Deployment**: Render.com (backend) + Vercel (frontend)  

---

## 👤 Authored By

<p align="left">
  <a href="https://www.linkedin.com/in/nasserq" target="_blank">
    <img src="https://github.com/nasserqadri/whispers-hollow/raw/main/frontend/public/images/nasser_qadri.png" alt="Nasser Qadri" width="64" style="border-radius: 50%; border: 2px solid #1f7aeb;" />
    <br />
    <strong>Nasser Qadri, PhD</strong><br />
    <em>AI Engineer @ Google</em>
  </a>
</p>

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Python 3.9+](https://www.python.org/)
- [Google Gemini API Key](https://aistudio.google.com/app/apikey)

---

### 1. Clone the Repository

```bash
git clone https://github.com/nasserqadri/whispers-hollow.git
cd whispers-hollow
```

### 2. Setup the Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Setup the Backend

```bash
cd ../backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```
Create a .env file in the backend/ directory:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

Then run:

```bash
uvicorn main:app --reload --port 8000
```

### 4. Launch the Game

Open [http://localhost:5173](http://localhost:5173) in your browser.

Make sure your backend is running on `http://localhost:8000` (or whatever value you set for `VITE_BACKEND_URL` in your frontend `.env`).

You should now see the intro modal. Click **“Enter the Hollow”** to begin the AI-driven mystery experience.

