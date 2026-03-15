import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

function FreelancerDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const fetchJobs = async () => {
    if (!token) return;
    setError('');
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(res.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!token) {
    return (
      <section className="max-w-md mx-auto">
        <p className="text-sm text-slate-400">
          Please log in as a freelancer to view available jobs.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold text-slate-50 mb-4">Freelancer Dashboard</h2>
      {error && <p className="text-xs text-rose-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-400">Loading available jobs…</p>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-slate-400">No available jobs at the moment.</p>
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

export default FreelancerDashboard;

