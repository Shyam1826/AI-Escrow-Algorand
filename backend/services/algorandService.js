
const algosdk = require('algosdk');

// Algonode public Testnet endpoint for Algorand.
// This backend connects to Testnet and builds payment transactions,
// but for safety it does NOT broadcast them. In a real app you would
// sign and send from a wallet such as Pera or a backend-held account.
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = '';
const ALGOD_TOKEN = '';

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

async function getSuggestedParamsSafe() {
  try {
    return await algodClient.getTransactionParams().do();
  } catch (e) {
    // Fallback dummy params if Testnet endpoint is unavailable.
    return {
      fee: 1000,
      firstRound: 1,
      lastRound: 1000,
      genesisID: 'testnet-v1.0',
      genesisHash: 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI='
    };
  }
}

/**
 * Build a payment transaction that sends funds from a client address
 * to an escrow (contract) address on Algorand Testnet.
 * This function returns the transaction ID as a simulation only.
 */
async function createEscrowTransaction(senderAddress, receiverAddress, amount) {
  const suggestedParams = await getSuggestedParamsSafe();

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: senderAddress,
    to: receiverAddress,
    amount: Math.round(Number(amount) * 1e6) || 0, // convert ALGO -> microAlgos
    suggestedParams
  });

  // Simulate signing with a placeholder account (not broadcast).
  // In production, use a real account or wallet connection instead.
  const txId = txn.txID().toString();

  return {
    txId,
    simulated: true,
    type: 'escrow_funding'
  };
}

/**
 * Build a payment transaction that releases escrow funds to the freelancer.
 * Returns a simulated transaction object with txId.
 */
async function releasePayment(receiverAddress, amount) {
  const suggestedParams = await getSuggestedParamsSafe();

  const fakeEscrowAddress = 'ESCROW-PLACEHOLDER-ADDRESS';

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: fakeEscrowAddress,
    to: receiverAddress,
    amount: Math.round(Number(amount) * 1e6) || 0,
    suggestedParams
  });

  const txId = txn.txID().toString();

  return {
    txId,
    simulated: true,
    type: 'release_payment'
  };
}

/**
 * Build a payment transaction that refunds funds from escrow back to the client.
 * Returns a simulated transaction object with txId.
 */
async function refundClient(clientAddress, amount) {
  const suggestedParams = await getSuggestedParamsSafe();

  const fakeEscrowAddress = 'ESCROW-PLACEHOLDER-ADDRESS';

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: fakeEscrowAddress,
    to: clientAddress,
    amount: Math.round(Number(amount) * 1e6) || 0,
    suggestedParams
  });

  const txId = txn.txID().toString();

  return {
    txId,
    simulated: true,
    type: 'refund_client'
  };
}

module.exports = {
  createEscrowTransaction,
  releasePayment,
  refundClient
};
