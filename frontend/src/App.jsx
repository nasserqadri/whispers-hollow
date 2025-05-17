import React, { useState, useEffect } from 'react';
import { Howl } from 'howler';
import IntroModal from './components/IntroModal';
import TopBar from './components/TopBar';
import GhostChatPanel from './components/GhostChatPanel';
import AdminPanel from './components/AdminPanel';
import MapPanel from './components/MapPanel';
import CluesPanel from './components/CluesPanel';
import toast, { Toaster } from 'react-hot-toast';

const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const ghosts = {
  "Lantern Girl": {
    portrait: "/images/lantern-girl.png",
    intro: "You shouldn’t be here… She’s watching from the Hollow…",
    mood: "curious"
  }
};

const choices = [
  "What secrets do you know?",
  "Who is watching?",
  "I’m not afraid of her."
];

const initialMapLocations = {
  "map:lantern_shrine": { label: "Lantern Shrine", x: "23%", y: "19%", opacity: 0 },
  "map:whispering_well": { label: "Whispering Well", x: "80%", y: "65%", opacity: 0 },
  "map:clocktower": { label: "Clocktower", x: "80%", y: "28%", opacity: 0 }
};

const ghostAura = {
  curious: 'from-yellow-200 via-orange-300 to-red-200',
  angry: 'from-red-600 via-red-800 to-black',
  sad: 'from-indigo-300 via-purple-600 to-slate-800',
  peaceful: 'from-emerald-200 via-green-300 to-teal-200'
};

export default function WhispersOfTheHollow() {
  const [showIntroModal, setShowIntroModal] = useState(true);
  const [selectedGhost] = useState("Lantern Girl");
  const [dialogue, setDialogue] = useState(ghosts[selectedGhost].intro);
  const [customInput, setCustomInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [memory, setMemory] = useState([]);
  const [mood, setMood] = useState(ghosts[selectedGhost].mood);
  const [prevMood, setPrevMood] = useState(mood);
  const [isAngryMusic, setIsAngryMusic] = useState(mood === "angry");
  const [currentSound, setCurrentSound] = useState(null);
  const [arcStates, setArcStates] = useState({});
  const [storyArcs, setStoryArcs] = useState({});
  const [unlocked, setUnlocked] = useState([]);
  const [dialogueHistory, setDialogueHistory] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [mapLocations, setMapLocations] = useState(initialMapLocations);
  const [showAdmin, setShowAdmin] = useState(false);

  const staticArcKeys = new Set(["lantern_shrine", "whispering_well", "clocktower"]);
  const staticMapKeys = new Set(Object.keys(initialMapLocations));

  useEffect(() => {
    fetch(`${baseURL}/health`).catch(err => console.warn("Health check failed:", err));
  }, []);

  useEffect(() => {
    const initialSound = new Howl({
      src: [mood === "angry" ? '/sounds/epic.mp3' : '/sounds/riffusion_choir_haunting.mp3'],
      loop: true,
      volume: 0.4
    });
    initialSound.play();
    setCurrentSound(initialSound);
    return () => initialSound.stop();
  }, []);

  useEffect(() => {
    const init = async () => {
      const { arc_states, story_arcs } = await getGhostReply(selectedGhost, "init", memory, sessionId, []);
      setArcStates(arc_states);
      setStoryArcs(story_arcs);
    };
    init();
  }, []);

  const getGhostReply = async (ghost, userInput, memory, sessionId, dialogueHistory) => {
    const res = await fetch(`${baseURL}/talk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ghost, user_input: userInput, memory, session_id: sessionId, dialogue_history: dialogueHistory })
    });
    const data = await res.json();
    return {
      reply: data.reply || "(The ghost whispers nothing...)",
      mood: data.mood || "curious",
      unlocks: data.unlocks || [],
      arc_states: data.arc_states || {},
      story_arcs: data.story_arcs || {}
    };
  };

  const getFollowups = async (ghost, userInput, memory, sessionId, dialogueHistory) => {
    const res = await fetch(`${baseURL}/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ghost, user_input: userInput, memory, session_id: sessionId, dialogue_history: dialogueHistory })
    });
    const data = await res.json();
    return data.questions || [];
  };

  const handleUserInput = async (text) => {
    setLoading(true);
    setDialogue("...");
    const updatedHistory = [...dialogueHistory, `User: ${text}`];
    const { reply, mood: newMood, unlocks, arc_states, story_arcs } = await getGhostReply(
      selectedGhost, text, memory, sessionId, updatedHistory
    );
    updatedHistory.push(`Ghost: ${reply}`);
    setDialogue(reply);
    setMood(newMood);
    setArcStates(arc_states);
    setStoryArcs(story_arcs);

    const updatedMemory = Array.from(new Set([...memory, text, ...unlocks]));
    const updatedUnlocks = Array.from(new Set([...unlocked, ...unlocks]));
    const knownMapLocations = new Set([
      ...unlocks.filter(u => u.startsWith("map:")),
      ...Object.values(story_arcs || {}).flatMap(arc =>
        [...(arc.required || []), ...(arc.optional || [])].filter(i => i.startsWith("map:"))
      )
    ]);

    const updatedMap = { ...mapLocations };
    let dynamicIndex = Object.keys(updatedMap).filter(k => !staticMapKeys.has(k)).length;

    knownMapLocations.forEach(loc => {
      const isDynamic = !staticMapKeys.has(loc);
      if (!updatedMap[loc]) {
        const label = loc.replace(/^map:/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        let x = "50%", y = "50%";
        if (isDynamic) {
          if (dynamicIndex === 0) { x = "50%"; y = "50%"; }
          else if (dynamicIndex === 1) { x = "20%"; y = "85%"; }
          else { x = "80%"; y = "80%"; }
          dynamicIndex++;
        }
        updatedMap[loc] = { label, x, y, opacity: 1.0 };

        toast.success(`New map location unlocked: ${label}`, {
          duration: 5000,
        });
      } else if (unlocks.includes(loc)) {
        updatedMap[loc].opacity = 1.0;
      }
    });

    // 🔔 Clue notifications
    const newlyDiscoveredClues = updatedUnlocks.filter(
      clue => !unlocked.includes(clue) && !clue.startsWith("map:")
    );

    newlyDiscoveredClues.forEach(clue => {
      const label = clue.replace(/^.*:/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      toast.success(`New clue discovered: ${label}`, {
        duration: 5000,
      });
    });

    const followupSuggestions = await getFollowups(selectedGhost, text, updatedMemory, sessionId, updatedHistory);
    setMapLocations(updatedMap);
    setMemory(updatedMemory);
    setUnlocked(updatedUnlocks);
    setDialogueHistory(updatedHistory);
    setFollowups(followupSuggestions);
    setLoading(false);
  };

  const currentObjective = () => {
    for (const [arcKey, arc] of Object.entries(storyArcs)) {
      const state = arcStates[arcKey];
      if (["active", "discovered"].includes(state)) {
        const missing = arc.required?.filter(req => !memory.includes(req));
        if (missing?.length > 0) {
          const item = missing[0];
          const label = item.replace(/^.*:/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          return `Current Objective: Find ${label}`;
        }
      }
    }
    return null;
  };

  return (
    <div className="relative min-h-screen font-sans bg-black text-white overflow-hidden">
      <Toaster
        position="bottom-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#1f1f1f',
            color: '#f0f0f0',
            border: '1px solid #3b3b3b',
            padding: '16px',
            fontSize: '0.9rem',
          },
          success: {
            iconTheme: {
              primary: '#10b981', // green-500
              secondary: '#1f2937', // gray-800
            },
          },
          error: {
            iconTheme: {
              primary: '#f87171', // red-400
              secondary: '#1f2937',
            },
          },
        }}
      />
      {showIntroModal && <IntroModal onClose={() => setShowIntroModal(false)} />}
      <div className={`absolute inset-0 z-0 transition-opacity duration-1000 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${ghostAura[prevMood]}`} />
      {mood !== prevMood && (
        <div className={`absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${ghostAura[mood]} opacity-0 animate-fadeIn`} />
      )}
      <div className="absolute inset-0 pointer-events-none bg-black/40 backdrop-blur-sm z-20" />
      <TopBar />
      <div className="relative z-30 flex flex-row w-full px-4 space-x-4 max-h-[calc(100vh-80px)] overflow-y-auto">
        <div className="relative z-30 w-1/2 flex flex-col p-4 space-y-4 overflow-y-auto max-h-screen">
          <GhostChatPanel
            selectedGhost={selectedGhost}
            ghosts={ghosts}
            mood={mood}
            dialogue={dialogue}
            loading={loading}
            currentObjective={currentObjective}
            followups={followups}
            choices={choices}
            handleUserInput={handleUserInput}
            customInput={customInput}
            setCustomInput={setCustomInput}
          />
          <button
            className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm tracking-wide"
            onClick={() => setShowAdmin(!showAdmin)}
          >
            {showAdmin ? "Hide Admin Panel" : "Show Admin Panel"}
          </button>
          {showAdmin && (
            <AdminPanel
              storyArcs={storyArcs}
              arcStates={arcStates}
              dialogueHistory={dialogueHistory}
              staticArcKeys={staticArcKeys}
            />
          )}
        </div>
        <div className="relative z-30 w-1/2 flex flex-col p-4 space-y-4 overflow-y-auto max-h-screen">
          <MapPanel
            mapLocations={mapLocations}
            discoveredMapMarkers={unlocked.filter(u => u.startsWith("map:"))}
            staticMapKeys={staticMapKeys}
          />
          <CluesPanel unlocked={unlocked} />
        </div>
      </div>
    </div>
  );
}
