import React from "react";

export default function AdminPanel({ storyArcs, arcStates, staticArcKeys, dialogueHistory }) {
  return (
    <div className="bg-gray-800/90 p-4 rounded shadow border border-gray-700">
      <h2 className="text-lg font-bold mb-3 text-rose-200 uppercase tracking-wider">Admin Panel</h2>

      {/* Story Arc Journal */}
      <div className="mb-6">
        <h3 className="text-md font-semibold mb-2 text-white">Story Arc Journal</h3>
        {Object.entries(storyArcs).length === 0 ? (
          <p className="italic text-gray-400">No arcs yet...</p>
        ) : (
          [...Object.entries(storyArcs)]
            .sort(([aKey], [bKey]) => {
              const aStatic = staticArcKeys.has(aKey);
              const bStatic = staticArcKeys.has(bKey);
              return aStatic === bStatic ? 0 : aStatic ? 1 : -1;
            })
            .map(([arc, details]) => (
              <div
                key={arc}
                className={`mb-2 p-2 rounded border-l-4 ${
                  arcStates[arc] === 'complete'
                    ? 'border-green-500 bg-green-900/30'
                    : arcStates[arc] === 'active'
                    ? 'border-blue-400 bg-blue-900/30'
                    : arcStates[arc] === 'discovered'
                    ? 'border-yellow-500 bg-yellow-900/30'
                    : 'border-gray-600 bg-gray-800/40'
                }`}
              >
                <p className="capitalize font-bold text-white">
                  {!staticArcKeys.has(arc) && (
                    <img
                      src="/images/ai_wand.png"
                      alt="AI"
                      className="inline-block w-11 h-11 mr-1 mb-[2px] opacity-90 animate-pulseWand"
                    />
                  )}
                  {arc.replace(/_/g, ' ')}
                </p>
                <p className="text-gray-300">Status: <span className="capitalize">{arcStates[arc]}</span></p>
                <p className="text-gray-400">Required: {details.required?.join(", ")}</p>
                {details.optional?.length > 0 && (
                  <p className="text-gray-500">Optional: {details.optional?.join(", ")}</p>
                )}
              </div>
            ))
        )}
      </div>

      {/* Conversation History */}
      <div>
        <h3 className="text-md font-semibold mb-2 text-white">Conversation History</h3>
        <div className="bg-gray-900/80 text-gray-100 p-3 rounded shadow max-h-40 overflow-y-auto">
          <ul className="space-y-1 text-sm">
            {dialogueHistory.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
