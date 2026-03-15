import React from "react";
import { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

function NegotiationChat() {
  const [jobId, setJobId] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingFinalize, setLoadingFinalize] = useState(false);
  const [error, setError] = useState('');
  const [agreedPrice, setAgreedPrice] = useState('');
  const [agreedScope, setAgreedScope] = useState('');
  const [agreedDeadline, setAgreedDeadline] = useState('');

  const handleSend = async () => {
    if (!jobId || !message.trim()) return;
    setError('');

    const role = localStorage.getItem('role') || 'client';

    const localMessage = {
      id: Date.now(),
      sender: role,
      message: message.trim(),
      isSystem: false
    };

    setMessages((prev) => [...prev, localMessage]);
    setMessage('');
    setLoadingSend(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE}/negotiation-message`,
        {
          jobId,
          message: localMessage.message
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to send negotiation message');
    } finally {
      setLoadingSend(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!jobId) {
      setError('Please enter a Job ID before requesting a suggestion.');
      return;
    }
    setError('');
    setLoadingAi(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE}/ai-price-suggestion`,
        {
          jobId
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      const { suggestedPrice, explanation } = response.data || {};
      const text =
        suggestedPrice !== undefined
          ? `AI suggests ${suggestedPrice} ALGO as a fair price. ${explanation || ''}`.trim()
          : 'AI could not determine a suggested price.';

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'system',
          message: text,
          isSystem: true
        }
      ]);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to get AI price suggestion');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleFinalizeAgreement = async () => {
    if (!jobId || !agreedPrice || !agreedScope || !agreedDeadline) {
      setError('Please fill in job ID, agreed price, scope, and deadline before finalizing.');
      return;
    }
    setError('');
    setLoadingFinalize(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE}/finalize-agreement`,
        {
          jobId,
          agreedPrice,
          agreedScope,
          deadline: agreedDeadline
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );

      const aiContract = response.data;
      const summary = `Agreement finalized. AI contract: ${aiContract.payment} ALGO, deadline ${aiContract.deadline}.`;

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: 'system',
          message: summary,
          isSystem: true
        }
      ]);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to finalize agreement');
    } finally {
      setLoadingFinalize(false);
    }
  };

  return (
    <section className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-slate-50 mb-4">Negotiation Chat</h2>
      <p className="text-sm text-slate-400 mb-6">
        Facilitate a negotiation between client and freelancer, then ask the AI to suggest a fair
        project price in ALGO based on the conversation.
      </p>

      <div className="card space-y-4">
        <div className="flex flex-col md:flex-row gap-3 text-xs">
          <div className="flex-1">
            <label className="label" htmlFor="jobId">
              Job ID
            </label>
            <input
              id="jobId"
              type="text"
              className="input"
              placeholder="Contract ID from the job"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="message">
            Message
          </label>
          <textarea
            id="message"
            className="input min-h-[70px] resize-y"
            placeholder="Propose scope, timelines, or pricing details..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="label" htmlFor="agreedPrice">
              Agreed Price (ALGO)
            </label>
            <input
              id="agreedPrice"
              type="number"
              min="0"
              step="0.01"
              className="input"
              placeholder="e.g. 120"
              value={agreedPrice}
              onChange={(e) => setAgreedPrice(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="agreedScope">
              Agreed Scope
            </label>
            <input
              id="agreedScope"
              type="text"
              className="input"
              placeholder="Short summary of the final agreed scope"
              value={agreedScope}
              onChange={(e) => setAgreedScope(e.target.value)}
            />
          </div>
        </div>

        <div className="text-xs">
          <label className="label" htmlFor="agreedDeadline">
            Agreed Deadline
          </label>
          <input
            id="agreedDeadline"
            type="date"
            className="input"
            value={agreedDeadline}
            onChange={(e) => setAgreedDeadline(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-rose-400">{error}</p>}

        <div className="flex flex-wrap justify-between gap-3">
          <button
            type="button"
            onClick={handleSend}
            disabled={loadingSend}
            className="btn-primary"
          >
            {loadingSend ? 'Sending…' : 'Send Message'}
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAiSuggest}
              disabled={loadingAi}
              className="btn-outline text-xs"
            >
              {loadingAi ? 'Requesting AI Suggestion…' : 'Ask AI for Price Suggestion'}
            </button>
            <button
              type="button"
              onClick={handleFinalizeAgreement}
              disabled={loadingFinalize}
              className="btn-primary text-xs"
            >
              {loadingFinalize ? 'Finalizing…' : 'Finalize Agreement'}
            </button>
          </div>
        </div>
      </div>

      <div className="card mt-6 h-80 overflow-y-auto space-y-3 text-xs">
        {messages.length === 0 ? (
          <p className="text-slate-500 text-xs">
            Start the negotiation by sending a message as the client or freelancer.
          </p>
        ) : (
          messages.map((m) => {
            if (m.sender === 'system' || m.isSystem) {
              return (
                <div key={m.id} className="flex justify-center">
                  <div className="max-w-[80%] rounded-lg bg-slate-800/80 px-3 py-2 text-[11px] text-slate-200 italic">
                    {m.message}
                  </div>
                </div>
              );
            }

            const isClient = m.sender === 'client';
            return (
              <div
                key={m.id}
                className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed ${
                    isClient
                      ? 'bg-emerald-600 text-slate-950 rounded-br-sm'
                      : 'bg-slate-800 text-slate-100 rounded-bl-sm'
                  }`}
                >
                  <p className="mb-1 text-[10px] uppercase tracking-wide opacity-80">
                    {isClient ? 'Client' : 'Freelancer'}
                  </p>
                  <p>{m.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default NegotiationChat;

