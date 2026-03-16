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

/**
 * Sign a single Algorand transaction using the connected Pera wallet session.
 * @param {Uint8Array} unsignedTxnBytes - algosdk-encoded unsigned txn bytes
 * @returns {Promise<Uint8Array>} signed txn bytes
 */
export async function signTxnWithPera(unsignedTxnBytes) {
  // Pera expects an array of tx groups, each item being an array of txns.
  // Each txn entry includes raw bytes and optional signers.
  const signedGroups = await peraWallet.signTransaction([
    [
      {
        txn: unsignedTxnBytes
      }
    ]
  ]);

  const signed = signedGroups?.[0];
  if (!signed) {
    throw new Error('No signed transaction returned from wallet');
  }
  return signed;
}

export function getPeraWalletInstance() {
  return peraWallet;
}

