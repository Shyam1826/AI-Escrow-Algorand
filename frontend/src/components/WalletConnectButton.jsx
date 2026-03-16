import React from "react";
import { useState } from 'react';
import { connectPeraWallet, disconnectPeraWallet } from '../services/perawallet';

function truncateAddress(addr) {
  if (!addr) return '';
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-3)}`;
}

function WalletConnectButton({ onConnect, onDisconnect }) {
  const [connecting, setConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);

  const handleConnectClick = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      const address = await connectPeraWallet();
      if (address) {
        setWalletAddress(address);
        if (onConnect) onConnect(address);
      }
    } catch (error) {
      console.error('Failed to connect Pera Wallet', error);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectClick = async () => {
    try {
      await disconnectPeraWallet();
      setWalletAddress(null);
    } finally {
      if (onDisconnect) {
        onDisconnect();
      }
    }
  };

  const isConnected = Boolean(walletAddress);

  return (
    <button
      type="button"
      onClick={isConnected ? handleDisconnectClick : handleConnectClick}
      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
        isConnected
          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
          : 'border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800'
      }`}
      disabled={connecting}
    >
      {connecting
        ? 'Connecting…'
        : isConnected
        ? `Disconnect Wallet (${truncateAddress(walletAddress)})`
        : 'Connect Wallet'}
    </button>
  );
}

export default WalletConnectButton;

