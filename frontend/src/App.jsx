import React from "react";
import { Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar.jsx';

import Home from './pages/Home.jsx';
import CreateJob from './pages/CreateJob.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SubmitWork from './pages/SubmitWork.jsx';
import NegotiationChat from './pages/NegotiationChat.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

import ClientDashboard from './pages/ClientDashboard.jsx';
import FreelancerDashboard from './pages/FreelancerDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/client-dashboard"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelancer-dashboard"
            element={
              <ProtectedRoute allowedRoles={['freelancer']}>
                <FreelancerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-job"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <CreateJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit-work"
            element={
              <ProtectedRoute allowedRoles={['freelancer']}>
                <SubmitWork />
              </ProtectedRoute>
            }
          />
          <Route
            path="/negotiation"
            element={
              <ProtectedRoute>
                <NegotiationChat />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;

console.log("API:", import.meta.env.VITE_API_URL);