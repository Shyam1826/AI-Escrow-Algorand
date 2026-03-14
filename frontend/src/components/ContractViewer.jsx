import React from "react";
function ContractViewer({ contract }) {
  if (!contract) return null;

  const ai = contract.aiContract || null;

  return (
    <div className="card mt-6 space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-100 mb-3">Contract Details</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">Contract ID</dt>
            <dd className="text-slate-100 font-mono text-xs">#{contract.contractId}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">Job</dt>
            <dd className="text-right text-slate-100 max-w-xs">
              {ai?.job || contract.job}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">Payment</dt>
            <dd className="text-slate-100">
              {ai?.payment || contract.payment}{' '}
              <span className="text-[11px] text-slate-400">ALGO (simulated)</span>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">Deadline</dt>
            <dd className="text-slate-100">{ai?.deadline || contract.deadline}</dd>
          </div>
          {contract.status && (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Status</dt>
              <dd className="text-slate-100 capitalize">{contract.status}</dd>
            </div>
          )}
        </dl>
      </div>

      {ai && (
        <>
          <div className="border-t border-slate-800 pt-4">
            <h4 className="text-xs font-semibold text-slate-200 mb-2 uppercase tracking-wide">
              Scope of Work
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {ai.scope}
            </p>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <h4 className="text-xs font-semibold text-slate-200 mb-2 uppercase tracking-wide">
              Terms &amp; Conditions
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {ai.terms}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default ContractViewer;

