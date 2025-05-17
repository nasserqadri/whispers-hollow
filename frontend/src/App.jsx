import React, { useState, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { Howl } from 'howler';

const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const ghosts = {
  "Lantern Girl": {
    portrait: "/images/lantern-girl.png",
    intro: "You shouldn’t be here… She’s watching from the Hollow…",
    mood: "curious"
  }
};

const choices = [
  "What do you mean?",
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
  const res = await fetch(`${baseURL}/talk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ghost, user_input: userInput, memory, session_id: sessionId, dialogue_history: dialogueHistory })
  });
  return await res.json();
};

const getFollowups = async (ghost, userInput, memory, sessionId, dialogueHistory) => {
  const res = await fetch(`${baseURL}/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ghost, user_input: userInput, memory, session_id: sessionId, dialogue_history: dialogueHistory })
  });
  const data = await res.json();
  console.log(data)
  return data.questions || [];
};



export default function WhispersOfTheHollow() {
  const [selectedGhost] = useState("Lantern Girl");
  const [dialogue, setDialogue] = useState(ghosts[selectedGhost].intro);
  const [customInput, setCustomInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [memory, setMemory] = useState([]);
  const [mood, setMood] = useState(ghosts[selectedGhost].mood);
  const [prevMood, setPrevMood] = useState(mood);
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

  useEffect(() => {
    whisperSound.play();
    return () => whisperSound.stop();
  }, []);

  useEffect(() => {
    if (mood !== prevMood) {
      setFadeIn(true);
      const timeout = setTimeout(() => {
        setPrevMood(mood);
        setFadeIn(false);
      }, 1500);
      return () => clearTimeout(timeout);
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


  return (
    <div className="relative min-h-screen flex flex-row overflow-hidden font-sans bg-black text-white">
      <div className={`absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${ghostAura[prevMood]}`} />
      {fadeIn && <div className={`absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${ghostAura[mood]} animate-fadeAura`} />}
      <div className="absolute inset-0 pointer-events-none bg-black/40 backdrop-blur-sm z-20" />

      <div className="relative z-30 w-1/2 flex flex-col p-4 space-y-4 overflow-y-auto max-h-screen">
        <h1 className="text-3xl font-bold mb-2">Whispers of the Hollow</h1>

        <div className="flex items-center space-x-4 bg-white/20 p-3 rounded shadow">
          <div className={`w-16 h-16 rounded-full ${ghostMoodGlow[mood]} transition-all duration-500`}>
            <img src={ghosts[selectedGhost].portrait} className="rounded-full w-full h-full" alt="Ghost" />
          </div>
          <div className="flex items-start space-x-2">
            <img
              src="/images/ai_wand.png"
              alt="AI"
              className="w-11 h-11 animate-pulseWand"
            />
            <div>
              <h2 className="text-xl font-semibold">{selectedGhost}</h2>
              <p className="text-xl text-gray-200">Mood: {mood}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/90 border border-gray-700 rounded shadow">
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 text-sm font-semibold tracking-wider uppercase text-gray-300">
            Spirit Channel
          </div>
          <div className="p-4 min-h-[100px] text-white font-serif tracking-wide leading-relaxed">
            {currentObjective() && (
              <div className="mb-2 text-sm text-rose-200 italic bg-rose-900/30 px-3 py-1 rounded">
                {currentObjective()}
              </div>
            )}
            {loading ? (
              <p className="text-lg italic animate-pulse">The ghost is thinking...</p>
            ) : (
              <p className="text-lg flex items-start gap-2">
                <img
                  src="/images/ai_wand.png"
                  alt="AI"
                  className="inline-block w-11 h-11 mt-[3px] animate-pulseWand"
                />
                <TypeAnimation
                  key={dialogue}
                  sequence={[dialogue, 1000]}
                  wrapper="span"
                  speed={75}
                  cursor={false}
                />
              </p>
            )}
          </div>
          <div className="px-4 pb-4">
            <div className="space-y-2">
              {(followups.length > 0 ? followups : choices).map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => handleUserInput(choice)}
                  className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black rounded flex items-center space-x-2"
                >
                  {followups.length > 0 && (
                    <img
                      src="/images/ai_wand.png"
                      alt="AI"
                      className="w-10 h-10 inline-block animate-pulseWand"
                    />
                  )}
                  <span>{choice}</span>
                </button>
              ))}

            </div>
            <div className="flex mt-2">
              <input
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Speak your mind..."
                className="flex-grow bg-gray-800 text-white p-2 rounded-l-md placeholder-gray-400"
              />
              <button
                onClick={() => handleUserInput(customInput)}
                className="bg-rose-500 px-4 py-2 text-white rounded-r-md hover:bg-rose-400"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/10 p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2 text-white">Story Arc Journal</h2>
          {Object.entries(storyArcs).length === 0 ? (
            <p className="italic text-gray-400">No arcs yet...</p>
          ) : (
            [...Object.entries(storyArcs)]
              .sort(([aKey], [bKey]) => {
                const aStatic = staticArcKeys.has(aKey);
                const bStatic = staticArcKeys.has(bKey);
                return aStatic === bStatic ? 0 : aStatic ? 1 : -1; // AI arcs first
              })
              .map(([arc, details]) => (

                <div key={arc} className={`mb-2 p-2 rounded border-l-4
                ${arcStates[arc] === 'complete' ? 'border-green-500 bg-green-900/30' :
                    arcStates[arc] === 'active' ? 'border-blue-400 bg-blue-900/30' :
                      arcStates[arc] === 'discovered' ? 'border-yellow-500 bg-yellow-900/30' :
                        'border-gray-600 bg-gray-800/40'}`}>
                  <p className="capitalize font-bold text-white">
                    {!staticArcKeys.has(arc) && (
                      <img
                        src="/images/ai_wand.png"
                        alt="AI"
                        className="inline-block w-11 h-11 mr-1 mb-[2px] opacity-90 animate-pulseWand"
                      />
                    )}

                    {arc.replace(/_/g, ' ')}</p>
                  <p className="text-gray-300">Status: <span className="capitalize">{arcStates[arc]}</span></p>
                  <p className="text-gray-400">Required: {details.required?.join(", ")}</p>
                  {details.optional?.length > 0 && <p className="text-gray-500">Optional: {details.optional?.join(", ")}</p>}
                </div>
              ))
          )}
        </div>
      </div>

      <div className="relative z-30 w-1/2 flex flex-col p-4 space-y-4 overflow-y-auto max-h-screen">
        <div className="relative border border-gray-600 rounded shadow">
          <img src="/images/map-hollow.png" alt="Map of the Hollow" className="w-full rounded" />
          {Object.entries(mapLocations).map(([key, loc]) => {
            const isUnlocked = discoveredMapMarkers.includes(key);
            const isDynamic = !staticMapKeys.has(key);

            return (
              <div
                key={key}
                className="absolute text-black text-base font-bold px-2 py-1 rounded-full shadow border border-yellow-600 bg-yellow-200 transition-opacity duration-700 flex items-center space-x-1"
                style={{
                  left: loc.x,
                  top: loc.y,
                  transform: 'translate(-50%, -50%)',
                  fontSize: '1.0rem',
                  opacity: isUnlocked ? 1.0 : loc.opacity ?? 0.2
                }}
              >
                <span className="flex items-center space-x-1">
                  {isDynamic && (
                    <img
                      src="/images/ai_wand.png"
                      alt="AI"
                      title="AI-generated location"
                      className="inline-block w-10 h-10 mb-[2px] animate-pulseWand"
                    />
                  )}
                  <span>{loc.label}</span>
                  {isUnlocked && <span>✅</span>}
                </span>
              </div>
            );
          })}

        </div>

        <div className="bg-white/10 p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2 text-white">Discovered Clues</h2>
          {unlocked.length === 0 ? (
            <p className="italic text-gray-400">No clues yet...</p>
          ) : (
            <ul className="list-disc list-inside space-y-1">
              {unlocked.map((item, idx) => (
                <li key={idx} className="capitalize text-white">{item.replace(/[:_]/g, ' ')}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-gray-900/80 text-gray-100 p-4 rounded shadow max-h-60 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-2 text-white">Conversation History </h2>
          <ul className="space-y-1">
            {dialogueHistory.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
