
import React, { useEffect, useRef } from "react";
import { TypeAnimation } from "react-type-animation";
import { ghostMoodGlow } from "../utils/constants";

export default function GhostChatPanel({
    mood,
    selectedGhost,
    ghosts,
    dialogue,
    loading,
    dialogueHistory,
    customInput,
    setCustomInput,
    handleUserInput,
    followups,
    choices,
    currentObjective
}) {
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, [dialogue]);

    const capitalize = (str) => (str ? str[0].toUpperCase() + str.slice(1) : "");

    return (
        <div className="bg-gray-900/90 border border-gray-700 rounded shadow">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 text-sm font-semibold tracking-wider uppercase text-gray-300">
                You are currently speaking to...
            </div>

            <div className="flex items-center space-x-4 p-4 border-b border-gray-700">
                <div className={`w-28 h-28 rounded-full ${ghostMoodGlow[mood]} transition-all duration-500`}>
                    <img
                        src={ghosts[selectedGhost]?.portrait}
                        className="rounded-full w-full h-full"
                        alt="Ghost"
                    />
                </div>
                <div className="flex items-start space-x-2">
                    <img
                        src="/images/ai_wand.png"
                        alt="AI"
                        className="w-11 h-11 animate-pulseWand"
                    />
                    <div>
                        <h2 className="text-xl font-semibold">{selectedGhost}</h2>
                        <p className="text-xl text-gray-200">Mood: {capitalize(mood)}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 min-h-[100px] text-white font-serif tracking-wide leading-relaxed border-b border-gray-700">
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

            {/* Input Field */}
            <div className="px-4 py-4 ">
                <div className="flex">
                    <input
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && customInput.trim()) {
                                handleUserInput(customInput);
                                setCustomInput("");
                            }
                        }}
                        autoFocus
                        placeholder="Type your response here..."
                        className="flex-grow bg-gray-100 text-black placeholder-gray-500 px-4 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1f7aeb] transition duration-200"
                    />
                    <button
                        onClick={() => {
                            handleUserInput(customInput);
                            setCustomInput("");
                        }}
                        className="bg-rose-500 px-4 py-2 text-white rounded-r-md hover:bg-rose-400"
                    >
                        Send
                    </button>
                </div>
            </div>
            <div className="px-4 pb-4 space-y-2">
                {(followups.length > 0 || choices.length > 0) && (
                    <p className="text-sm text-gray-400 italic mb-1">Or you can ask…</p>
                )}
                {(followups.length > 0 ? followups : choices).map((choice, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleUserInput(choice)}
                        className="w-full px-4 py-2 bg-gray-800 text-gray-100 border border-gray-600 hover:bg-gray-700 rounded-md shadow-sm flex items-center space-x-2 transition-all duration-200"
                    >
                        {followups.length > 0 && (
                            <img
                                src="/images/ai_wand.png"
                                alt="AI"
                                className="w-6 h-6 inline-block animate-pulseWand"
                            />
                        )}
                        <span className="text-sm">{choice}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
