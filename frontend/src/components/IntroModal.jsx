import React from "react";

export default function IntroModal({ onClose }) {
    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="relative w-full max-w-5xl bg-[#1a1a1a] text-white rounded-xl shadow-2xl overflow-hidden border border-gray-700">
                {/* Low-opacity background image */}
                <div
                    className="absolute inset-0 z-0 bg-center bg-cover opacity-15 pointer-events-none"
                    style={{ backgroundImage: `url('/images/whispers_background_map.png')` }}
                ></div>

                {/* Close button */}
                <button
                    onClick={() => onClose?.()}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white text-3xl z-30"
                >
                    &times;
                </button>

                <div className="flex flex-col md:flex-row p-6 md:p-10 space-y-6 md:space-y-0 md:space-x-10 items-start relative z-20">
                    {/* Left: Ghost Image */}
                    <img
                        src="/images/ghost_intro.png"
                        alt="Lantern Ghost"
                        className="w-48 h-48 rounded-lg shadow-md border border-gray-600"
                    />

                    {/* Right: Content */}
                    <div className="flex-1 space-y-6 text-left">
                        {/* Title and Description */}
                        <div>
                            <h1 className="text-4xl font-bold text-yellow-200">Whispers of the Hollow</h1>
                            <p className="text-gray-300 mt-2 text-lg">
                                An AI-powered mystery exploration engine weaving living stories through haunted dialogue and evolving objectives. Everything with an{" "}
                                <img
                                    src="/images/ai_wand.png"
                                    alt="AI"
                                    className="inline w-8 h-8 animate-pulseWand mb-1"
                                />{" "}
                                is AI-generated.
                            </p>
                        </div>

                        <div className="col-span-3">
                            <h2 className="font-bold text-[#1f7aeb] mb-1 uppercase tracking-widest text-sm">
                                Core Themes
                            </h2>
                            <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                                <li>Interactive and adaptive storytelling driven by LLMs</li>
                                <li>Branching discovery: locations, lore, and characters evolve dynamically</li>
                                <li>Emotional resonance: sadness, fear, hope — all modulated by player interactions</li>
                                <li>Living map: the world unfolds as you speak, for your own story.</li>
                            </ul>
                        </div>




                        {/* Content Breakdown */}
                        <div className="grid grid-cols-5 gap-6 text-sm">
                            <div className="col-span-3">
                                <h2 className="font-bold text-[#1f7aeb] mb-1 uppercase tracking-widest text-sm">
                                    Includes
                                </h2>
                                <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                                    <li>AI-generated dialogue and follow-up questions</li>
                                    <li>AI-generated story arcs, map items, and objectives</li>
                                    <li>AI-based mood detection and music & visual effects</li>
                                    <li>AI-generated music (Riffusion)</li>
                                    <li>AI-generated images and map (GPT + DALL·E)</li>
                                </ul>
                            </div>

                            <div className="col-span-2">
                                <h2 className="font-bold text-[#1f7aeb] mb-1 uppercase tracking-widest text-sm">
                                    Does not include
                                </h2>
                                <ul className="list-disc list-inside text-gray-400 italic space-y-1 text-sm">
                                    <li>Actual game mechanics or movement</li>
                                    <li>Combat, inventory, or win/lose states</li>
                                </ul>
                            </div>

                            <div className="col-span-5">
                                <h2 className="font-bold text-[#1f7aeb] mb-1 uppercase tracking-widest text-sm">
                                    AI Icon Legend
                                </h2>
                                <p className="text-gray-300 text-sm flex items-center">
                                    <img
                                        src="/images/ai_wand.png"
                                        alt="AI Wand"
                                        className="w-10 h-10 inline-block mr-2 animate-pulseWand"
                                    />
                                    = AI-generated content
                                </p>
                            </div>

                            <div className="col-span-5">
                                <h2 className="font-bold text-[#1f7aeb] mb-1 uppercase tracking-widest text-sm">
                                    Tech Stack
                                </h2>
                                <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                                    <li>
                                        <a
                                            href="https://github.com/nasserqadri/whispers-hollow"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm text-blue-400 hover:text-blue-300 underline inline-flex items-center space-x-2"
                                        >
                                            Github link
                                        </a>
                                    </li>
                                    <li>LLM: Gemini</li>
                                    <li>Frontend: React + Tailwind CSS</li>
                                    <li>Backend: Python, FastAPI</li>
                                    <li>Deployment: Render.com (backend) and Vercel (frontend)</li>
                                </ul>
                            </div>
                        </div>

                        {/* Author */}
                        <h2 className="font-bold text-[#1f7aeb] mb-1 uppercase tracking-widest text-sm">
                            Authored by
                        </h2>
                        <div className="flex items-center space-x-4">
                            <a
                                href="https://www.linkedin.com/in/nasserq"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center space-x-4"
                            >
                                <img
                                    src="/images/nasser_qadri.png"
                                    alt="Author"
                                    className="w-20 h-20 rounded-full border-[3px] border-blue-400"
                                />
                                <span className="text-lg font-semibold text-white hover:text-blue-400">
                                    Nasser Qadri, PhD (AI Engineer, Google)
                                </span>
                            </a>
                        </div>

                        {/* Play Button */}
                        <div className="pt-6 flex justify-center">
                            <button
                                onClick={() => onClose?.()}
                                className="px-8 py-3 bg-[#1f7aeb] hover:bg-[#1663c7] rounded-full text-white font-semibold text-md uppercase tracking-wide transition-all duration-300 shadow-lg"
                            >
                                Enter the Hollow
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
