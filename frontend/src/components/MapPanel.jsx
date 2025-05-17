import React from "react";

export default function MapPanel({ mapLocations, discoveredMapMarkers, staticMapKeys }) {
  return (
    <div className="bg-white/10 rounded shadow border border-gray-600 overflow-hidden">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 text-sm font-semibold tracking-wider uppercase text-gray-300">
        Map of the Hollow
      </div>

      <div className="relative">
        <img src="/images/map-hollow.png" alt="Map of the Hollow" className="w-full rounded-b" />

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
    </div>
  );
}
