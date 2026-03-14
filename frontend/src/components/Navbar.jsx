import React from "react";
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import WalletConnectButton from './WalletConnectButton.jsx';

function Navbar() {
  const [walletAddress, setWalletAddress] = useState(null);

  const navLinkClasses = ({ isActive }) =>
    `text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
      isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg">
            AI
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-slate-50">AI Escrow Platform</span>
            <span className="text-[11px] text-slate-400">Algorand Testnet Demo</span>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <NavLink to="/create-job" className={navLinkClasses}>
            Create Job
          </NavLink>
          <NavLink to="/dashboard" className={navLinkClasses}>
            Dashboard
          </NavLink>
          <NavLink to="/submit-work" className={navLinkClasses}>
            Submit Work
          </NavLink>
          <NavLink to="/negotiation" className={navLinkClasses}>
            Negotiation
          </NavLink>
          <div className="ml-2 flex items-center gap-2">
            {walletAddress && (
              <span className="hidden md:inline-flex max-w-[200px] truncate rounded-full bg-slate-900/80 border border-slate-700 px-3 py-1 text-[11px] font-mono text-slate-300">
                {walletAddress}
              </span>
            )}
            <WalletConnectButton
              onConnect={(addr) => setWalletAddress(addr)}
              onDisconnect={() => setWalletAddress(null)}
            />
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;

