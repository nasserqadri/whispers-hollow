import React, { useState, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { Howl } from 'howler';

const ghosts = {
  "Lantern Girl": {
    portrait: "/images/lantern-girl.png",
    intro: "You shouldn’t be here… She’s watching from the Well…",
    mood: "curious"
  },
  "Brother Salt": {
    portrait: "https://via.placeholder.com/100x100?text=Brother+Salt",
    intro: "You’ve come again. Still seeking answers you won’t like?",
    mood: "judging"
  }
};

const choices = [
  "What do you mean?",
  "Who is watching?",
  "I’m not afraid of her."
];

const whisperSound = new Howl({
  src: ['/sounds/dungeon_ambient.mp3'],
  loop: true,
  volume: 0.4
});

const getTimeTheme = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 18) return "bg-gradient-to-br from-indigo-200 via-gray-200 to-white text-black";
  return "bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white";
};

export default function WhispersOfTheHollow() {
  const [selectedGhost, setSelectedGhost] = useState("Lantern Girl");
  const [dialogue, setDialogue] = useState(ghosts[selectedGhost].intro);
  const [customInput, setCustomInput] = useState("");

  useEffect(() => {
    whisperSound.play();
    return () => whisperSound.stop();
  }, []);

  const handleChoiceClick = (choice) => {
    setDialogue(`"${choice}"... She pauses, then whispers something new.`);
  };

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      setDialogue(`"${customInput}"... The forest shivers.`);
      setCustomInput("");
    }
  };

  return (
    <div className={`relative min-h-screen p-4 flex flex-col items-center overflow-hidden ${getTimeTheme()}`}>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-gray-900/40 to-black/60 animate-[fogMove_30s_linear_infinite_alternate] z-0" />

      <style>
        {`@keyframes fogMove {
          0% { transform: translateX(0px) translateY(0px); }
          100% { transform: translateX(-30px) translateY(-20px); }
        }`}
      </style>

      <h1 className="text-3xl font-bold mb-6 z-10">Whispers of the Hollow</h1>

      <div className="bg-gray-800/80 p-4 rounded-xl shadow-lg w-full max-w-md z-10">
        <div className="flex items-center mb-4">
          <img src={ghosts[selectedGhost].portrait} alt="Ghost portrait" className="w-16 h-16 rounded-full mr-4" />
          <div>
            <h2 className="text-xl font-semibold">{selectedGhost}</h2>
            <p className="text-sm text-gray-400">Mood: {ghosts[selectedGhost].mood}</p>
          </div>
        </div>

        <div className="mb-4 min-h-[60px]">
          <TypeAnimation
            sequence={[dialogue, 1000]}
            wrapper="p"
            speed={50}
            className="text-lg flicker"
            cursor={false}
          />
        </div>

        <div className="space-y-2 mb-4">
          {choices.map((choice, idx) => (
            <button
              key={idx}
              onClick={() => handleChoiceClick(choice)}
              className="w-full text-left px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
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
            className="flex-grow bg-gray-700 text-white p-2 rounded-l-md focus:outline-none"
          />
          <button
            onClick={handleCustomSubmit}
            className="bg-indigo-600 px-4 py-2 rounded-r-md hover:bg-indigo-500"
          >
            Send
          </button>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-400 z-10">Ghosts change based on what you say…</div>
    </div>
  );
}
