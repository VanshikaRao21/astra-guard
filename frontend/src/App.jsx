import React from 'react';
import OpticalFeedViewer from './OpticalFeedViewer';

function App() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 tracking-wider">ASTRA-GUARD</h1>
          <p className="text-slate-400 mt-2">AI-Powered Space Object Tracking & Collision Risk Intelligence</p>
          <div className="mt-4 inline-block bg-red-900/50 text-red-400 border border-red-500/50 px-3 py-1 rounded text-sm font-semibold uppercase">
            SIMULATED DEMO SCENARIOS - NOT OPERATIONAL
          </div>
        </header>

        <main>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-300">Phase 1: Optical Detection & Tracking (Image Space)</h2>
            <OpticalFeedViewer />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
