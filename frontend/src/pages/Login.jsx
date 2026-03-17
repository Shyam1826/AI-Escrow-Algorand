import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';

const API_BASE = import.meta.env.VITE_API_URL;

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/login`, { email, password });
      handleLoginSuccess(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (data) => {
    const { token, role } = data;
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    if (role === 'client') {
      navigate('/client-dashboard');
    } else if (role === 'freelancer') {
      navigate('/freelancer-dashboard');
    } else {
      navigate('/');
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/google`, {
        token: credentialResponse.credential
      });
      handleLoginSuccess(res.data);
    } catch (err) {
      console.error('Google login error:', err);
      if (err.response?.data?.requiresRegistration) {
        setError('Account not found. Please register first.');
      } else {
        setError(err.response?.data?.error || 'Google Login failed');
      }
    }
  };

  return (
    <section className="max-w-sm mx-auto">
      <h2 className="text-2xl font-semibold text-slate-50 mb-4">Login</h2>
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
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Logging in…' : 'Login'}
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
            onSuccess={handleGoogleLogin}
            onError={() => {
              console.log('Google Login Failed');
              setError('Google Login failed');
            }}
          />
        </div>
      </form>
    </section>
  );
}

export default Login;

