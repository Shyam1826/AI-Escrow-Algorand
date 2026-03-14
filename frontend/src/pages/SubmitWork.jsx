import React from "react";
import { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

function SubmitWork() {
  const [contractId, setContractId] = useState('');
  const [submissionLink, setSubmissionLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/submit-work`, {
        contractId: Number(contractId),
        submissionLink
      });
      if (response.data?.status === 'submitted') {
        setSuccess('Work submitted successfully. The client can now review and release escrow.');
      }
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

