require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const {
  createEscrowTransaction,
  releasePayment,
  refundClient
} = require('./services/algorandService');
const { generateContract, generatePriceSuggestion } = require('./services/aiService');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json()); // built-in body parser for JSON
app.use(bodyParser.urlencoded({ extended: false })); // demonstrate body-parser usage as requested

// In-memory job store for demo purposes
let jobs = [];
// In-memory negotiation messages keyed by jobId
const negotiations = {};

// POST /generate-contract
app.post('/generate-contract', async (req, res) => {
  const { description, budget, deadline } = req.body;

  if (!description || !budget || !deadline) {
    return res.status(400).json({ error: 'description, budget, and deadline are required' });
  }

  const contractId = Date.now();

  let aiContract = null;
  try {
    aiContract = await generateContract(description, budget, deadline);
  } catch (error) {
    // generateContract already logs and falls back, but keep a guard here.
    console.error('Error generating AI contract:', error.message);
  }

  const job = {
    contractId,
    job: description,
    payment: budget,
    deadline,
    status: 'created',
    escrowTxId: null,
    aiContract
  };

  jobs.push(job);

  console.log('AI contract generated for job:', contractId);

  res.json(job);
});

// GET /jobs
app.get('/jobs', (req, res) => {
  res.json(jobs);
});

// POST /create-escrow
// Creates an Algorand Testnet payment transaction from a placeholder client
// address into a placeholder escrow contract address, then stores the
// simulated transaction ID on the job.
app.post('/create-escrow', async (req, res) => {
  const { contractId, amount } = req.body;

  if (!contractId || !amount) {
    return res.status(400).json({ error: 'contractId and amount are required' });
  }

  const job = jobs.find((j) => j.contractId === Number(contractId) || j.contractId === contractId);

  if (!job) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  try {
    const clientAddress = 'CLIENT-PLACEHOLDER-ADDRESS';
    const escrowAddress = 'ESCROW-PLACEHOLDER-ADDRESS';

    const result = await createEscrowTransaction(clientAddress, escrowAddress, amount);

    job.status = 'escrow_locked';
    job.escrowTxId = result.txId;

    console.log('Escrow locked on Algorand:', {
      contractId: job.contractId,
      amount,
      escrowTxId: result.txId
    });

    res.json({ status: 'escrow_created', escrowTxId: result.txId });
  } catch (error) {
    console.error('Error creating escrow transaction:', error);
    res.status(500).json({ error: 'Failed to create escrow transaction' });
  }
});

// POST /submit-work
app.post('/submit-work', (req, res) => {
  const { contractId, submissionLink } = req.body;

  if (!contractId || !submissionLink) {
    return res.status(400).json({ error: 'contractId and submissionLink are required' });
  }

  const job = jobs.find((j) => j.contractId === Number(contractId) || j.contractId === contractId);

  if (!job) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  job.status = 'submitted';
  job.submissionLink = submissionLink;

  console.log('Work submitted for job:', {
    contractId: job.contractId,
    submissionLink
  });

  res.json({ status: 'submitted' });
});

// POST /release-payment
// Simulates releasing escrow funds to the freelancer by building an Algorand
// payment transaction from the escrow address to a placeholder receiver.
app.post('/release-payment', async (req, res) => {
  const { contractId } = req.body;

  if (!contractId) {
    return res.status(400).json({ error: 'contractId is required' });
  }

  const job = jobs.find((j) => j.contractId === Number(contractId) || j.contractId === contractId);

  if (!job) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  try {
    const receiverAddress = 'FREELANCER-PLACEHOLDER-ADDRESS';
    const amount = job.payment;

    const result = await releasePayment(receiverAddress, amount);

    job.status = 'completed';

    console.log('Payment released on Algorand:', {
      contractId: job.contractId,
      txId: result.txId
    });

    res.json({ status: 'completed', txId: result.txId });
  } catch (error) {
    console.error('Error releasing payment:', error);
    res.status(500).json({ error: 'Failed to release payment' });
  }
});

// POST /refund-client
// Simulates refunding the client by building an Algorand payment transaction
// from the escrow address back to a placeholder client address.
app.post('/refund-client', async (req, res) => {
  const { contractId } = req.body;

  if (!contractId) {
    return res.status(400).json({ error: 'contractId is required' });
  }

  const job = jobs.find((j) => j.contractId === Number(contractId) || j.contractId === contractId);

  if (!job) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  try {
    const clientAddress = 'CLIENT-PLACEHOLDER-ADDRESS';
    const amount = job.payment;

    const result = await refundClient(clientAddress, amount);

    job.status = 'refunded';

    console.log('Client refunded on Algorand:', {
      contractId: job.contractId,
      txId: result.txId
    });

    res.json({ status: 'refunded', txId: result.txId });
  } catch (error) {
    console.error('Error refunding client:', error);
    res.status(500).json({ error: 'Failed to refund client' });
  }
});

// POST /negotiation-message
app.post('/negotiation-message', (req, res) => {
  const { jobId, sender, message } = req.body;

  if (!jobId || !sender || !message) {
    return res.status(400).json({ error: 'jobId, sender, and message are required' });
  }

  const key = String(jobId);
  if (!negotiations[key]) {
    negotiations[key] = [];
  }

  const entry = {
    sender,
    message,
    timestamp: new Date().toISOString()
  };

  negotiations[key].push(entry);

  console.log('Negotiation message stored:', { jobId: key, sender, message });

  res.json({ status: 'ok' });
});

// POST /ai-price-suggestion
app.post('/ai-price-suggestion', async (req, res) => {
  const { jobId } = req.body;

  if (!jobId) {
    return res.status(400).json({ error: 'jobId is required' });
  }

  const key = String(jobId);
  const messages = negotiations[key] || [];

  if (messages.length === 0) {
    return res.status(400).json({ error: 'No negotiation messages found for this jobId' });
  }

  try {
    const suggestion = await generatePriceSuggestion(messages);
    res.json(suggestion);
  } catch (error) {
    console.error('Error generating AI price suggestion:', error.message);
    res.status(500).json({ error: 'Failed to generate price suggestion' });
  }
});

// POST /finalize-agreement
app.post('/finalize-agreement', async (req, res) => {
  const { jobId, agreedPrice, agreedScope, deadline } = req.body;

  if (!jobId || !agreedPrice || !agreedScope || !deadline) {
    return res
      .status(400)
      .json({ error: 'jobId, agreedPrice, agreedScope, and deadline are required' });
  }

  const job = jobs.find((j) => j.contractId === Number(jobId) || j.contractId === jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  try {
    // Store agreed terms on the job
    job.agreedPrice = agreedPrice;
    job.agreedScope = agreedScope;
    job.agreedDeadline = deadline;

    // Use the agreed scope and price to generate a final AI contract
    const aiContract = await generateContract(agreedScope, agreedPrice, deadline);

    job.aiContract = aiContract;
    job.payment = agreedPrice;
    job.deadline = deadline;
    job.status = 'agreement_finalized';

    console.log('Agreement finalized and AI contract generated for job:', job.contractId);

    res.json(aiContract);
  } catch (error) {
    console.error('Error finalizing agreement:', error.message);
    res.status(500).json({ error: 'Failed to finalize agreement' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

