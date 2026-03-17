import React from "react";
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authHeaders } from '../utils/auth';
import { connectSocket } from '../services/socket';

const API_BASE = import.meta.env.VITE_API_URL;

function ClientDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchJobs = async () => {
      setError('');
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/jobs`, authHeaders());
        setJobs(res.data || []);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || 'Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();

    const socket = connectSocket();
    const onJobAccepted = (payload) => {
      setNotice(`Your job #${payload.contractId} was accepted by a freelancer.`);
      fetchJobs();
    };
    socket?.on('jobAccepted', onJobAccepted);

    return () => {
      socket?.off('jobAccepted', onJobAccepted);
    };
  }, [navigate]);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-slate-50">Client Dashboard</h2>
        <Link to="/create-job" className="btn-primary text-xs">
          Create New Job
        </Link>
      </div>
      {notice && <p className="text-xs text-emerald-300 mb-3">{notice}</p>}
      {error && <p className="text-xs text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-400">Loading your jobs…</p>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-slate-400">You haven&apos;t created any jobs yet.</p>
      ) : (
        <div className="grid gap-4 text-xs">
          {jobs.map((job) => (
            <div key={job.contractId} className="card space-y-1">
              <p className="font-medium text-slate-50">{job.job}</p>
              <p className="text-slate-400">Contract #{job.contractId}</p>
              <p className="text-slate-300">
                {job.payment} ALGO · Deadline {job.deadline}
              </p>
              <p className="text-[11px] text-slate-400 capitalize">Status: {job.status}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ClientDashboard;

