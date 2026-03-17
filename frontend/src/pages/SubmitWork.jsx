import React from "react";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authHeaders } from '../utils/auth';

const API_BASE = import.meta.env.VITE_API_URL;

function SubmitWork() {
  const [contractId, setContractId] = useState('');
  const [submissionLink, setSubmissionLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess('');

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError('Please login first');
        navigate('/login');
        return;
      }
  
      const response = await axios.post(
        `${API_BASE}/submit-work`,
        {
          contractId,
          submissionLink
        },
        authHeaders()
      );
  
      setSuccess('Work submitted successfully');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to submit work');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold text-slate-50 mb-4">Submit Work</h2>
      <p className="text-sm text-slate-400 mb-6">
        Paste the contract ID and a link to your completed work (e.g. GitHub repo, deployed site,
        or shared document).
      </p>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label" htmlFor="contractId">
            Contract ID
          </label>
          <input
            id="contractId"
            type="number"
            min="1"
            className="input"
            placeholder="e.g. 1"
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="submissionLink">
            Submission Link
          </label>
          <input
            id="submissionLink"
            type="url"
            className="input"
            placeholder="https://github.com/your-name/project"
            value={submissionLink}
            onChange={(e) => setSubmissionLink(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-xs text-rose-400">{error}</p>}
        {success && <p className="text-xs text-emerald-400">{success}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit Work'}
        </button>
      </form>
    </section>
  );
}

export default SubmitWork;

