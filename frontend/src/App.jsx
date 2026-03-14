import React from "react";
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import CreateJob from './pages/CreateJob.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SubmitWork from './pages/SubmitWork.jsx';
import NegotiationChat from './pages/NegotiationChat.jsx';

function App() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-job" element={<CreateJob />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/submit-work" element={<SubmitWork />} />
          <Route path="/negotiation" element={<NegotiationChat />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

