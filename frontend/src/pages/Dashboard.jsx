import React from "react";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import JobCard from '../components/JobCard.jsx';
import algosdk from 'algosdk';
import { Buffer } from 'buffer';
import { connectPeraWallet, signTxnWithPera } from '../services/perawallet';
import { authHeaders } from '../utils/auth';

const API_BASE = import.meta.env.VITE_API_URL;
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = '';
const ALGOD_TOKEN = '';

function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [escrowLoadingId, setEscrowLoadingId] = useState(null);
  const [releaseLoadingId, setReleaseLoadingId] = useState(null);
  const [refundLoadingId, setRefundLoadingId] = useState(null);
  const [txByContractId, setTxByContractId] = useState({});
  const navigate = useNavigate();

  const fetchJobs = async () => {
    setError('');
    try {
      const response = await axios.get(`${API_BASE}/jobs`, authHeaders());
      setJobs(response.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first');
      navigate('/login');
      return;
    }
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleLockEscrow = async (job) => {
    setError('');
    setEscrowLoadingId(job.contractId);
    try {
      const address = await connectPeraWallet();
      if (!address) {
        throw new Error('Wallet connection failed');
      }

      const escrowInfo = await axios.get(`${API_BASE}/escrow-address`);
      const escrowAddress = escrowInfo.data?.escrowAddress;
      if (!escrowAddress) {
        throw new Error('Escrow address missing from backend');
      }

      const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
      const suggestedParams = await algodClient.getTransactionParams().do();

      const amountMicroAlgos = Math.round(Number(job.payment) * 1e6);
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: address,
        to: escrowAddress,
        amount: amountMicroAlgos,
        suggestedParams
      });

      const unsignedTxnBytes = txn.toByte();
      const signedTxnBytes = await signTxnWithPera(unsignedTxnBytes);
      const signedTxBase64 = Buffer.from(signedTxnBytes).toString('base64');

      const response = await axios.post(
        `${API_BASE}/create-escrow`,
        {
          contractId: job.contractId,
          signedTx: signedTxBase64
        },
        authHeaders()
      );

      if (response.data?.escrowTxId) {
        setTxByContractId((prev) => ({
          ...prev,
          [job.contractId]: response.data.escrowTxId
        }));
      }
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
      const response = await axios.post(
        `${API_BASE}/release-payment`,
        { contractId: job.contractId },
        authHeaders()
      );
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
      const response = await axios.post(
        `${API_BASE}/refund-client`,
        { contractId: job.contractId },
        authHeaders()
      );
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
                onLockEscrow={() => handleLockEscrow(job)}
                locking={escrowLoadingId === job.contractId}
                onReleasePayment={() => handleReleasePayment(job)}
                onRefundClient={() => handleRefundClient(job)}
                releasing={releaseLoadingId === job.contractId}
                refunding={refundLoadingId === job.contractId}
                lastTxId={txByContractId[job.contractId]}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Dashboard;

