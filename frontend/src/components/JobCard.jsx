import React from "react";
function getStatusBadgeClasses(status) {
  switch (status) {
    case 'created':
      return 'bg-gray-500/20 text-gray-200';
    case 'escrow_locked':
      return 'bg-yellow-500/20 text-yellow-200';
    case 'submitted':
      return 'bg-blue-500/20 text-blue-200';
    case 'completed':
      return 'bg-emerald-500/20 text-emerald-200';
    case 'refunded':
      return 'bg-rose-500/20 text-rose-200';
    default:
      return 'bg-slate-700 text-slate-100';
  }
}

function JobCard({
  job,
  onLockEscrow,
  locking = false,
  onReleasePayment,
  onRefundClient,
  releasing = false,
  refunding = false,
  lastTxId
}) {
  const isCompletedOrRefunded = job.status === 'completed' || job.status === 'refunded';
  const showEscrowActions = job.status === 'submitted';
  const canLockEscrow = !job.escrowTxId && (job.status === 'created' || job.status === 'agreement_finalized');
  const txIdToShow = job.escrowTxId || lastTxId;

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-50 flex items-center gap-2">
            {job.job}
          </p>
          <p className="mt-1 text-xs text-slate-400 flex items-center gap-2">
            <span>Contract #{job.contractId}</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(
                job.status
              )}`}
            >
              {job.status}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs mt-1">
        <div>
          <p className="text-slate-400">Payment</p>
          <p className="text-slate-100 font-medium">
            {job.payment} <span className="text-[11px] text-slate-400">ALGO</span>
          </p>
        </div>
        <div>
          <p className="text-slate-400">Deadline</p>
          <p className="text-slate-100 font-medium">{job.deadline}</p>
        </div>
      </div>

      {canLockEscrow && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={onLockEscrow}
            disabled={!onLockEscrow || locking}
            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
              !onLockEscrow || locking
                ? 'bg-yellow-500/20 text-yellow-200 cursor-not-allowed'
                : 'bg-yellow-500 text-slate-900 hover:bg-yellow-400'
            }`}
          >
            {locking ? 'Locking…' : 'Lock Escrow'}
          </button>
        </div>
      )}

      {job.submissionLink && (
        <div className="mt-2 text-xs">
          <p className="text-slate-400">Submission</p>
          <a
            href={job.submissionLink}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-300 hover:text-emerald-200 underline break-all"
          >
            {job.submissionLink}
          </a>
        </div>
      )}

      {showEscrowActions && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onReleasePayment}
              disabled={isCompletedOrRefunded || releasing}
              className={`inline-flex items-center rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                isCompletedOrRefunded || releasing
                  ? 'bg-emerald-500/20 text-emerald-200 cursor-not-allowed'
                  : 'bg-emerald-500 text-slate-900 hover:bg-emerald-400'
              }`}
            >
              {releasing ? 'Releasing…' : 'Release Payment'}
            </button>

            <button
              type="button"
              onClick={onRefundClient}
              disabled={isCompletedOrRefunded || refunding}
              className={`inline-flex items-center rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                isCompletedOrRefunded || refunding
                  ? 'bg-rose-500/20 text-rose-200 cursor-not-allowed'
                  : 'bg-rose-500 text-slate-50 hover:bg-rose-400'
              }`}
            >
              {refunding ? 'Refunding…' : 'Refund Client'}
            </button>
          </div>

        </div>
      )}

      {txIdToShow && (
        <div className="text-[11px] break-all">
          <p className="text-slate-400">
            Tx: <span className="font-mono text-slate-200">{txIdToShow}</span>
          </p>
          <a
            href={`https://testnet.algoexplorer.io/tx/${txIdToShow}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-blue-400 underline"
          >
            View on AlgoExplorer
          </a>
        </div>
      )}
    </div>
  );
}

export default JobCard;

