import React, { useState, useEffect, useRef } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { Howl } from 'howler';
import IntroModal from './components/IntroModal';
import TopBar from './components/TopBar';
import GhostChatPanel from './components/GhostChatPanel';
import AdminPanel from './components/AdminPanel';
import MapPanel from './components/MapPanel';
import CluesPanel from './components/CluesPanel';



const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const moodSounds = {
  curious: new Howl({ src: ['/sounds/riffusion_choir_haunting.mp3'], loop: true, volume: 0 }),
  angry: new Howl({ src: ['/sounds/epic.mp3'], loop: true, volume: 0 }),
  sad: new Howl({ src: ['/sounds/riffusion_choir_haunting.mp3'], loop: true, volume: 0 }),
  peaceful: new Howl({ src: ['/sounds/riffusion_choir_haunting.mp3'], loop: true, volume: 0 })
};


const ghosts = {
  "Lantern Girl": {
    portrait: "/images/lantern-girl.png",
    intro: "You shouldn’t be here… She’s watching from the Hollow…",
    mood: "curious"
  }
};

const choices = [
  "What is the Hollow?",
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

const ghostMoodGlow = {
  curious: 'shadow-[0_0_20px_4px_rgba(253,224,71,0.5)]',
  angry: 'shadow-[0_0_20px_4px_rgba(220,38,38,0.5)]',
  sad: 'shadow-[0_0_20px_4px_rgba(139,92,246,0.5)]',
  peaceful: 'shadow-[0_0_20px_4px_rgba(52,211,153,0.5)]'
};

const whisperSound = new Howl({
  src: ['/sounds/riffusion_choir_haunting.mp3'],
  loop: true,
  volume: 0.4
});

const getGhostReply = async (ghost, userInput, memory = [], sessionId, dialogueHistory) => {
  try {
    const res = await fetch(`${baseURL}/talk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ghost, user_input: userInput, memory, session_id: sessionId, dialogue_history: dialogueHistory })
    });

    if (!res.ok) throw new Error(`Server error ${res.status}: ${res.statusText}`);

    const data = await res.json();
    return {
      reply: data.reply || "(The ghost whispers nothing...)",
      mood: data.mood || "curious",
      unlocks: data.unlocks || [],
      arc_states: data.arc_states || {},
      story_arcs: data.story_arcs || {}
    };
  } catch (err) {
    console.error("Ghost reply error:", err);
    return {
      reply: "(The ghost is silent… something's wrong.)",
      mood: "sad",
      unlocks: [],
      arc_states: {},
      story_arcs: {}
    };
  }
};

const getFollowups = async (ghost, userInput, memory, sessionId, dialogueHistory) => {
  try {
    const res = await fetch(`${baseURL}/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ghost, user_input: userInput, memory, session_id: sessionId, dialogue_history: dialogueHistory })
    });

    if (!res.ok) throw new Error(`Server error ${res.status}: ${res.statusText}`);

    const data = await res.json();
    return data.questions || [];
  } catch (err) {
    console.warn("Followup suggestion failed:", err);
    return [];
  }
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
  const [fadeIn, setFadeIn] = useState(false);
  const [arcStates, setArcStates] = useState({});
  const [storyArcs, setStoryArcs] = useState({});
  const [unlocked, setUnlocked] = useState([]);
  const [dialogueHistory, setDialogueHistory] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [mapLocations, setMapLocations] = useState(initialMapLocations);


  const staticArcKeys = new Set(["lantern_shrine", "whispering_well", "clocktower"]);
  const staticMapKeys = new Set(Object.keys(initialMapLocations));
  const discoveredMapMarkers = unlocked.filter(u => u.startsWith("map:"));

  useEffect(() => {
    fetch(`${baseURL}/health`).catch(err => console.warn("Health check failed:", err));
  }, []);

  // useEffect(() => {
  //   whisperSound.play();
  //   return () => whisperSound.stop();
  // }, []);

  useEffect(() => {
    // Play default music at first load
    const initialSound = new Howl({
      src: [mood === "angry" ? '/sounds/epic.mp3' : '/sounds/riffusion_choir_haunting.mp3'],
      loop: true,
      volume: 0.4
    });

    initialSound.play();
    setCurrentSound(initialSound);
    setIsAngryMusic(mood === "angry");

    return () => {
      initialSound.stop();
      initialSound.unload();
    };
  }, []);

  useEffect(() => {
    const FADE_DURATION = 1500;

    const shouldBeAngry = mood === 'angry';
    if (shouldBeAngry === isAngryMusic) return; // no change needed

    const newSound = new Howl({
      src: [shouldBeAngry ? '/sounds/epic.mp3' : '/sounds/riffusion_choir_haunting.mp3'],
      loop: true,
      volume: 0
    });

    const playNewSound = () => {
      newSound.play();
      newSound.fade(0, 0.4, FADE_DURATION);
      setCurrentSound(newSound);
      setIsAngryMusic(shouldBeAngry);
    };

    if (currentSound) {
      currentSound.fade(0.4, 0, FADE_DURATION);
      currentSound.once('fade', () => {
        currentSound.stop();
        currentSound.unload();
        setTimeout(playNewSound, 100); // slight buffer before next
      });
    } else {
      playNewSound();
    }
  }, [mood]);


  useEffect(() => {
    const initializeSession = async () => {
      const { arc_states, story_arcs } = await getGhostReply(selectedGhost, "init", memory, sessionId, []);
      setArcStates(arc_states);
      setStoryArcs(story_arcs);
    };
    initializeSession();
  }, []);

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

  const handleUserInput = async (text) => {
    setLoading(true);
    setDialogue("...");
    const updatedHistory = [...dialogueHistory, `User: ${text}`];

    const { reply, mood: newMood, unlocks, arc_states, story_arcs } = await getGhostReply(
      selectedGhost,
      text,
      memory,
      sessionId,
      updatedHistory
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
          if (dynamicIndex === 0) {
            x = "50%"; y = "50%";
          } else if (dynamicIndex === 1) {
            x = "20%"; y = "85%";
          } else {
            x = "80%"; y = "80%";
          }
          dynamicIndex++;
        }

        updatedMap[loc] = {
          label, x, y, opacity: 1.0
        };
      }

      if (unlocks.includes(loc)) {
        updatedMap[loc].opacity = 1.0;
      }
    });

    const followupSuggestions = await getFollowups(
      selectedGhost,
      text,
      updatedMemory,
      sessionId,
      updatedHistory
    );

    setMapLocations(updatedMap);
    setMemory(updatedMemory);
    setUnlocked(updatedUnlocks);
    setDialogueHistory(updatedHistory);
    setFollowups(followupSuggestions);
    setLoading(false);
  };

  const [showAdmin, setShowAdmin] = useState(false);

  const capitalize = str => str ? str[0].toUpperCase() + str.slice(1) : '';


  return (
    <div className="relative min-h-screen font-sans bg-black text-white overflow-hidden">
      {showIntroModal && <IntroModal onClose={() => setShowIntroModal(false)} />}

      {/* Background layers */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-1000 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${ghostAura[prevMood]}`} />
      {mood !== prevMood && (
        <div className={`absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${ghostAura[mood]} opacity-0 animate-fadeIn`} />
      )}
      <div className="absolute inset-0 pointer-events-none bg-black/40 backdrop-blur-sm z-20" />

      {/* Top Title Bar */}
      <TopBar />

      {/* Main Content */}
      <div className="relative z-30 flex flex-row w-full px-4 space-x-4 max-h-[calc(100vh-80px)] overflow-y-auto">
        {/* Left Column */}
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
            capitalize={capitalize}
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

        {/* Right Column */}
        <div className="relative z-30 w-1/2 flex flex-col p-4 space-y-4 overflow-y-auto max-h-screen">
          <MapPanel
            mapLocations={mapLocations}
            discoveredMapMarkers={unlocked.filter(u => u.startsWith("map:"))}
            staticMapKeys={new Set(Object.keys(initialMapLocations))}
          />
          <CluesPanel unlocked={unlocked} />
        </div>
      </div>
    </div>
  );

}
