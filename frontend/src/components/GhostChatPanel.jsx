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
    }, []);

    const capitalize = (str) => (str ? str[0].toUpperCase() + str.slice(1) : "");

    return (
        <div className="bg-gray-900/90 border border-gray-700 rounded shadow">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 text-sm font-semibold tracking-wider uppercase text-gray-300">
                You are currently speaking to...
            </div>

            <div className="flex items-start space-x-4 p-4 border-b border-gray-700">
                {/* Avatar + Mood/Name */}
                <div className="flex flex-col items-center">
                    <div className={`w-28 h-28 rounded-full ${ghostMoodGlow[mood]} transition-all duration-500 mb-2`}>
                        <img
                            src={ghosts[selectedGhost]?.portrait}
                            className="rounded-full w-full h-full"
                            alt="Ghost"
                        />
                    </div>
                    <div className="flex items-center space-x-2 space-y-4">
                        <img src="/images/ai_wand.png" alt="AI" className="w-10 h-10 animate-pulseWand mt-4" />
                        <div className="text-center">
                            <h2 className="text-lg font-semibold">{selectedGhost}</h2>
                            <p className="text-sm text-gray-300">Mood: {capitalize(mood)}</p>
                        </div>
                    </div>
                </div>

                {/* Dialogue Area */}
                <div className="flex-1 relative">
                    {currentObjective() && (
                        <div className="mb-2 text-sm text-rose-200 italic bg-rose-900/30 px-3 py-1 rounded">
                            {currentObjective()}
                        </div>
                    )}
                    <div className="text-white font-serif tracking-wide leading-relaxed bg-gray-800/60 p-3 rounded text-lg relative italic">
                        <span className="text-6xl text-yellow-200 absolute -left-4 -top-4 select-none">“</span>
                        {loading ? (
                            <p className="italic animate-pulse">The ghost is thinking...</p>
                        ) : (
                            <p className="flex items-start gap-2">
                                <img
                                    src="/images/ai_wand.png"
                                    alt="AI"
                                    className="w-10 h-10 mt-[4px] mr-2 animate-pulseWand"
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
                        <span
                            className="text-6xl text-yellow-200 absolute select-none"
                            style={{ right: '-0.3rem', bottom: '-2.5rem' }}
                        >
                            ”
                        </span>

                    </div>
                </div>
            </div>

            {/* Input Field */}
            <div className="px-4 py-4 ">
                <div className="flex">
                    <input
                        ref={inputRef}
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && customInput.trim()) {
                                handleUserInput(customInput);
                                setCustomInput("");
                            }
                        }}
                        placeholder="Speak your mind..."
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

            {/* Follow-Up Suggestions */}
            {(followups.length > 0 || choices.length > 0) && (
                <div className="px-4 pb-6">
                    <p className="text-sm text-gray-400 italic mb-2 text-center">Or you can ask…</p>
                    <div className="flex flex-col items-center space-y-2">
                        {(followups.length > 0 ? followups : choices).map((choice, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleUserInput(choice)}
                                className="w-full max-w-xl px-4 py-2 bg-gray-800 text-white border border-gray-600 hover:bg-gray-700 transition duration-200 rounded flex items-center space-x-2 animate-fade-in"
                                style={{ animationDelay: `${idx * 0.1}s` }}
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
            )}

        </div>
    );
}
