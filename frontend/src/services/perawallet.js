import { PeraWalletConnect } from '@perawallet/connect';

// Singleton PeraWalletConnect instance for the app.
const peraWallet = new PeraWalletConnect();

/**
 * Connect to Pera Wallet and return the first selected account address.
 */
export async function connectPeraWallet() {
  const accounts = await peraWallet.connect();
  // Persist session for reconnects
  peraWallet.connector?.on('disconnect', () => {
    // no-op; Navbar/Button handle local state
  });

  return accounts[0] || null;
}

/**
 * Disconnect the existing Pera Wallet session.
 */
export async function disconnectPeraWallet() {
  try {
    await peraWallet.disconnect();
  } catch {
    // ignore disconnect errors in demo
  }
}

export function getPeraWalletInstance() {
  return peraWallet;
}

