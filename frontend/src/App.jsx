import React, { useState, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { Howl } from 'howler';

const ghosts = {
  "Lantern Girl": {
    portrait: "/images/lantern-girl.png",
    intro: "You shouldn’t be here… She’s watching from the Well…",
    mood: "curious"
  }
};

const ghostAura = {
  curious: 'from-yellow-200 via-orange-300 to-red-200',
  angry: 'from-red-600 via-red-800 to-black',
  sad: 'from-indigo-300 via-purple-600 to-slate-800',
  peaceful: 'from-emerald-200 via-green-300 to-teal-200'
};

const choices = [
  "What do you mean?",
  "Who is watching?",
  "I’m not afraid of her."
];

const whisperSound = new Howl({
  src: ['/sounds/whispers.mp3'],
  loop: true,
  volume: 0.4
});

const getGhostReply = async (ghost, userInput, memory = []) => {
  try {
    const res = await fetch('http://localhost:8000/talk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ghost, user_input: userInput, memory })
    });
    const data = await res.json();
    return {
      reply: data.reply || "(The ghost whispers nothing...)",
      mood: data.mood || "curious"
    };
  } catch (e) {
    return {
      reply: "(The connection to the spirit world has failed.)",
      mood: "sad"
    };
  }
};

export default function WhispersOfTheHollow() {
  const [selectedGhost] = useState("Lantern Girl");
  const [dialogue, setDialogue] = useState(ghosts[selectedGhost].intro);
  const [customInput, setCustomInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [memory, setMemory] = useState([
    "The player once lit the lantern",
    "You warned them about the Wellmother"
  ]);

  const [mood, setMood] = useState(ghosts[selectedGhost].mood);
  const [prevMood, setPrevMood] = useState(mood);
  const [fadeIn, setFadeIn] = useState(false);

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

  const handleUserInput = async (text) => {
    setLoading(true);
    setDialogue("...");
    const { reply, mood: updatedMood } = await getGhostReply(selectedGhost, text, memory);
    setDialogue(reply);
    setMemory([...memory, text]);
    setMood(updatedMood);
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden font-sans">
      <style>
        {`
          @keyframes fadeAura {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fogMove {
            0% { transform: translateX(0px) translateY(0px); }
            100% { transform: translateX(-30px) translateY(-20px); }
          }
          @keyframes flicker {
            0%, 18%, 22%, 25%, 53%, 57%, 100% { opacity: 1; }
            20%, 24%, 55% { opacity: 0.3; }
          }
        `}
      </style>

      {/* Base background (previous mood) */}
      <div className={`
        absolute inset-0 z-0
        bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] 
        ${ghostAura[prevMood]}
      `} />

      {/* Fade-in background (new mood) */}
      {fadeIn && (
        <div className={`
          absolute inset-0 z-10
          bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] 
          ${ghostAura[mood]}
          animate-fadeAura
        `} />
      )}

      {/* Fog overlay */}
      <div className="absolute inset-0 pointer-events-none bg-black/40 backdrop-blur-sm z-20 animate-[fogMove_30s_linear_infinite_alternate]" />

      {/* UI */}
      <div className="relative z-30 flex flex-col items-center p-4">
        <h1 className="text-3xl font-bold mb-6 text-white">Whispers of the Hollow</h1>

        <div className="bg-white/80 backdrop-blur-md text-black p-4 rounded-xl shadow-lg w-full max-w-md">
          <div className="flex items-center mb-4">
            <img src={ghosts[selectedGhost].portrait} alt="Ghost portrait" className="w-16 h-16 rounded-full mr-4" />
            <div>
              <h2 className="text-xl font-semibold">{selectedGhost}</h2>
              <p className="text-sm text-gray-600">Mood: {mood}</p>
            </div>
          </div>

          <div className="mb-4 min-h-[80px]">
            {loading ? (
              <p className="text-lg italic animate-pulse">The ghost is thinking...</p>
            ) : (
              <TypeAnimation
                sequence={[dialogue, 1000]}
                wrapper="p"
                speed={50}
                className="text-lg"
                cursor={false}
              />
            )}
          </div>

          <div className="space-y-2 mb-4">
            {choices.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => handleUserInput(choice)}
                className="w-full text-left px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md"
              >
                {choice}
              </button>
            ))}
          </div>

          <div className="flex mt-4">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Speak your mind..."
              className="flex-grow bg-gray-100 text-black p-2 rounded-l-md focus:outline-none"
            />
            <button
              onClick={() => handleUserInput(customInput)}
              className="bg-rose-500 px-4 py-2 rounded-r-md hover:bg-rose-400 text-white"
            >
              Send
            </button>
          </div>
        </div>

        <div className="mt-6 text-sm text-white z-30">Ghosts change based on what you say…</div>
      </div>
    </div>
  );
}
