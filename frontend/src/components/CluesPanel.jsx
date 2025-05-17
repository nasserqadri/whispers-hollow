import React from "react";

export default function CluesPanel({ unlocked }) {
  return (
    <div className="bg-white/10 rounded shadow border border-gray-600">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 text-sm font-semibold tracking-wider uppercase text-gray-300">
        Discovered Clues
      </div>
      <div className="p-4">
        {unlocked.length === 0 ? (
          <p className="italic text-gray-700">No clues yet...</p>
        ) : (
          <ul className="list-disc list-inside space-y-1">
            {unlocked.map((item, idx) => (
              <li key={idx} className="capitalize text-white">
                {item.replace(/[:_]/g, ' ')}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
