import React from "react";
import { useState } from 'react';
import axios from 'axios';
import ContractViewer from '../components/ContractViewer.jsx';

const API_BASE = 'http://localhost:5000';

function CreateJob() {
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    try {
      const token = localStorage.getItem("token");
  
      const response = await axios.post(
        `${API_BASE}/generate-contract`,
        {
          description,
          budget,
          deadline
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
  
      setContract(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to generate contract');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold text-slate-50 mb-4">Create a New Job</h2>
      <p className="text-sm text-slate-400 mb-6">
        Describe the work, budget, and deadline. The backend will generate a simple contract object
        that can be funded via escrow on Algorand Testnet (simulated).
      </p>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label" htmlFor="description">
            Job Description
          </label>
          <textarea
            id="description"
            className="input min-h-[80px] resize-y"
            placeholder="e.g. Build a marketing landing page using React and Tailwind..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="budget">
              Budget (ALGO)
            </label>
            <input
              id="budget"
              type="number"
              min="0"
              step="0.01"
              className="input"
              placeholder="100"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="deadline">
              Deadline
            </label>
            <input
              id="deadline"
              type="date"
              className="input"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>
        </div>

        {error && <p className="text-xs text-rose-400">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Generating Contract…' : 'Generate Contract'}
        </button>
      </form>

      <ContractViewer contract={contract} />
    </section>
  );
}

export default CreateJob;

