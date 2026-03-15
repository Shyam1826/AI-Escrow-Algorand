import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';

const API_BASE = 'http://localhost:5000';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/register`, { email, password, role });
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async (credentialResponse) => {
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/google`, {
        token: credentialResponse.credential,
        role: role
      });
      const { token: jwtToken, role: userRole } = res.data;
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('role', userRole);

      if (userRole === 'client') {
        navigate('/client-dashboard');
      } else if (userRole === 'freelancer') {
        navigate('/freelancer-dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Google register error:', err);
      setError(err.response?.data?.error || 'Google Registration failed');
    }
  };

  return (
    <section className="max-w-sm mx-auto">
      <h2 className="text-2xl font-semibold text-slate-50 mb-4">Register</h2>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Role</label>
          <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setRole('client')}
              className={`px-3 py-1.5 font-semibold ${
                role === 'client'
                  ? 'bg-slate-700 text-slate-50'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              Client
            </button>
            <button
              type="button"
              onClick={() => setRole('freelancer')}
              className={`px-3 py-1.5 font-semibold ${
                role === 'freelancer'
                  ? 'bg-slate-700 text-slate-50'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              Freelancer
            </button>
          </div>
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Register'}
        </button>

        <div className="relative my-6 opacity-80">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-900 text-slate-400">Or continue with</span>
          </div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleRegister}
            onError={() => {
              console.log('Google Registration Failed');
              setError('Google Registration failed');
            }}
          />
        </div>
      </form>
    </section>
  );
}

export default Register;

