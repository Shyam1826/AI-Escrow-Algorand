import React from "react";
import { useEffect, useState } from 'react';
import axios from 'axios';
import JobCard from '../components/JobCard.jsx';

const API_BASE = 'http://localhost:5000';

function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [escrowLoadingId, setEscrowLoadingId] = useState(null);
  const [releaseLoadingId, setReleaseLoadingId] = useState(null);
  const [refundLoadingId, setRefundLoadingId] = useState(null);
  const [txByContractId, setTxByContractId] = useState({});

  const fetchJobs = async () => {
    setError('');
    try {
      const response = await axios.get(`${API_BASE}/jobs`);
      setJobs(response.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDepositEscrow = async (job) => {
    setError('');
    setEscrowLoadingId(job.contractId);
    try {
      await axios.post(`${API_BASE}/create-escrow`, {
        contractId: job.contractId,
        amount: job.payment
      });
      await fetchJobs();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to create escrow');
    } finally {
      setEscrowLoadingId(null);
    }
  };

  const handleReleasePayment = async (job) => {
    setError('');
    setReleaseLoadingId(job.contractId);
    try {
      const response = await axios.post(`${API_BASE}/release-payment`, {
        contractId: job.contractId
      });
      if (response.data?.txId) {
        setTxByContractId((prev) => ({
          ...prev,
          [job.contractId]: response.data.txId
        }));
      }
      await fetchJobs();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to release payment');
    } finally {
      setReleaseLoadingId(null);
    }
  };

  const handleRefundClient = async (job) => {
    setError('');
    setRefundLoadingId(job.contractId);
    try {
      const response = await axios.post(`${API_BASE}/refund-client`, {
        contractId: job.contractId
      });
      if (response.data?.txId) {
        setTxByContractId((prev) => ({
          ...prev,
          [job.contractId]: response.data.txId
        }));
      }
      await fetchJobs();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to refund client');
    } finally {
      setRefundLoadingId(null);
    }
  };

  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-2xl font-semibold text-slate-50">Dashboard</h2>
        <p className="text-xs text-slate-500">
          Jobs are stored in-memory on the backend for this demo.
        </p>
      </div>

      {error && <p className="mb-3 text-xs text-rose-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Loading jobs…</p>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-slate-400">
          No jobs yet. Create one from the <span className="font-semibold">Create Job</span> page.
        </p>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div key={job.contractId} className="space-y-3">
              <JobCard
                job={job}
                onReleasePayment={() => handleReleasePayment(job)}
                onRefundClient={() => handleRefundClient(job)}
                releasing={releaseLoadingId === job.contractId}
                refunding={refundLoadingId === job.contractId}
                lastTxId={txByContractId[job.contractId]}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleDepositEscrow(job)}
                  disabled={escrowLoadingId === job.contractId}
                >
                  {escrowLoadingId === job.contractId ? 'Creating Escrow…' : 'Deposit Escrow'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Dashboard;

