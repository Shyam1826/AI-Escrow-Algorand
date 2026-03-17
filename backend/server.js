require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Server } = require('socket.io');
const {
  createEscrowTransaction,
  broadcastSignedTransaction,
  releasePayment,
  refundClient
} = require('./services/algorandService');
const { generateContract, generatePriceSuggestion } = require('./services/aiService');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Middleware
app.use(cors({
  origin: "*", // for now (later restrict to your Vercel URL)
}));
app.use(express.json()); // built-in body parser for JSON
app.use(bodyParser.urlencoded({ extended: false })); // demonstrate body-parser usage as requested

// In-memory stores for demo purposes
let jobs = [];
// In-memory negotiation messages keyed by jobId
const negotiations = {};
// In-memory realtime chat messages
let messages = [];
// In-memory user store
let users = [];
let nextUserId = 1;

// Receiver address for escrow funding.
// NOTE: This is just a receiver account for the demo. Real escrow on Algorand
// usually uses a LogicSig (smart signature) escrow.
const ESCROW_ADDRESS =
  process.env.ESCROW_ADDRESS || 'S6FR4C3H4YWUQCDK2WGWVAXWIC6RRR7FOM4O3C2UAXZKXQ7XWZLNUWGOZE';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authorization token missing' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

function getBearerTokenFromHeader(value) {
  if (!value) return null;
  return value.startsWith('Bearer ') ? value.slice(7) : null;
}

// Socket.IO (rooms by userId)
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || getBearerTokenFromHeader(socket.handshake.headers?.authorization);
    if (!token) return next(new Error('Unauthorized'));
    const payload = jwt.verify(token, JWT_SECRET);
    socket.user = payload;
    return next();
  } catch {
    return next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user?.id;
  if (userId) {
    socket.join(`user:${userId}`);
  }

  socket.on('sendMessage', (data = {}) => {
    try {
      const jobId = data.jobId;
      const text = String(data.text || '').trim();
      if (!jobId || !text) return;

      const job = jobs.find((j) => j.contractId === Number(jobId) || j.contractId === jobId);
      if (!job) return;

      const senderId = socket.user.id;
      const senderRole = socket.user.role;
      const isClient = senderId === job.clientId;
      const isFreelancer = senderId === job.freelancerId;
      if (!isClient && !isFreelancer) return;

      const receiverId = isClient ? job.freelancerId : job.clientId;
      if (!receiverId) return; // must be assigned before realtime chat
      const receiverRole = isClient ? 'freelancer' : 'client';

      const msg = {
        senderId,
        senderRole,
        receiverId,
        receiverRole,
        jobId: String(jobId),
        text,
        timestamp: new Date().toISOString()
      };

      messages.push(msg);

      io.to(`user:${senderId}`).to(`user:${receiverId}`).emit('newMessage', msg);
    } catch {
      // ignore socket event errors for demo
    }
  });
});

// Auth endpoints
app.post('/register', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'email, password, and role are required' });
  }

  if (!['client', 'freelancer'].includes(role)) {
    return res.status(400).json({ error: 'role must be client or freelancer' });
  }

  const existing = users.find((u) => u.email === email);
  if (existing) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = {
    id: nextUserId++,
    email,
    password: hashed,
    role
  };
  users.push(user);

  res.status(201).json({ id: user.id, email: user.email, role: user.role });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user);
  res.json({ token, role: user.role });
});

app.post('/auth/google', async (req, res) => {
  const { token, role } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const email = payload.email;

    let user = users.find((u) => u.email === email);

    if (!user) {
      if (!role) {
        return res.status(404).json({ error: 'User not found. Please register.', requiresRegistration: true });
      }

      if (!['client', 'freelancer'].includes(role)) {
        return res.status(400).json({ error: 'role must be client or freelancer' });
      }

      user = {
        id: nextUserId++,
        email,
        password: 'OAUTH_USER',
        role
      };
      users.push(user);
    }

    const jwtToken = generateToken(user);
    res.json({ token: jwtToken, role: user.role });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

// POST /generate-contract
// Only clients can create jobs / contracts
app.post('/generate-contract', authMiddleware, requireRole('client'), async (req, res) => {
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
    id: contractId,
    contractId,
    job: description,
    payment: budget,
    deadline,
    clientId: req.user.id,
    freelancerId: null,
    assignedTo: null,
    status: 'created',
    escrowTxId: null,
    aiContract
  };

  jobs.push(job);

  console.log('AI contract generated for job:', contractId);

  res.json(job);
});

// GET /jobs
// Clients see their own jobs; freelancers see available jobs.
app.get('/jobs', authMiddleware, (req, res) => {
  if (req.user.role === 'client') {
    return res.json(jobs.filter((j) => j.clientId === req.user.id));
  }

  if (req.user.role === 'freelancer') {
    return res.json(
      jobs.filter((j) => !j.freelancerId && (j.status === 'created' || j.status === 'agreement_finalized'))
    );
  }

  res.json([]);
});

// POST /accept-job
// Only freelancers can accept a job. Only one freelancer can accept.
// Emits `jobAccepted` to the client room.
app.post('/accept-job', authMiddleware, requireRole('freelancer'), (req, res) => {
  const { contractId } = req.body;
  if (!contractId) {
    return res.status(400).json({ error: 'contractId is required' });
  }

  const job = jobs.find((j) => j.contractId === Number(contractId) || j.contractId === contractId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.freelancerId) {
    return res.status(409).json({ error: 'Job already accepted', freelancerId: job.freelancerId });
  }

  job.freelancerId = req.user.id;
  job.assignedTo = req.user.id;
  job.status = 'accepted';

  io.to(`user:${job.clientId}`).emit('jobAccepted', {
    contractId: job.contractId,
    jobId: job.contractId,
    clientId: job.clientId,
    freelancerId: job.freelancerId,
    status: job.status
  });

  return res.json({ status: 'accepted', job });
});

// GET /messages/:jobId
// Loads stored realtime chat messages for a job.
app.get('/messages/:jobId', authMiddleware, (req, res) => {
  const { jobId } = req.params;
  const job = jobs.find((j) => j.contractId === Number(jobId) || j.contractId === jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const isClient = req.user.id === job.clientId;
  const isFreelancer = req.user.id === job.freelancerId;
  if (!isClient && !isFreelancer) return res.status(403).json({ error: 'Not authorized' });

  const thread = messages.filter((m) => String(m.jobId) === String(jobId));
  res.json(thread);
});

// POST /create-escrow
// Accepts a signed transaction from the frontend (Pera Wallet), broadcasts it
// to Algorand Testnet, confirms it, then stores txId on the job.
app.post('/create-escrow', authMiddleware, requireRole('client'), async (req, res) => {
  const { contractId, signedTx } = req.body;

  if (!contractId || !signedTx) {
    return res.status(400).json({ error: 'contractId and signedTx are required' });
  }

  const job = jobs.find((j) => j.contractId === Number(contractId) || j.contractId === contractId);
  if (!job) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  if (job.clientId !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to lock escrow for this job' });
  }

  if (job.escrowTxId) {
    return res.status(409).json({ error: 'Escrow already locked for this job', escrowTxId: job.escrowTxId });
  }

  try {
    const signedBytes = Buffer.from(String(signedTx), 'base64');
    const result = await broadcastSignedTransaction(new Uint8Array(signedBytes));

    job.status = 'escrow_locked';
    job.escrowTxId = result.txId;

    console.log('Escrow locked on Algorand Testnet:', {
      contractId: job.contractId,
      escrowTxId: result.txId,
      confirmedRound: result.confirmation?.['confirmed-round']
    });

    res.json({ status: 'escrow_created', escrowTxId: result.txId });
  } catch (error) {
    console.error('Error creating escrow transaction:', error);
    res.status(500).json({ error: error?.message || 'Failed to create escrow transaction' });
  }
});

// Public helper endpoint so the frontend can build the payment txn.
app.get('/escrow-address', (req, res) => {
  res.json({ escrowAddress: ESCROW_ADDRESS });
});

// POST /submit-work
// Only assigned freelancer can submit work
app.post('/submit-work', authMiddleware, requireRole('freelancer'), (req, res) => {
  const { contractId, submissionLink } = req.body;

  if (!contractId || !submissionLink) {
    return res.status(400).json({ error: 'contractId and submissionLink are required' });
  }

  const job = jobs.find((j) => j.contractId === Number(contractId) || j.contractId === contractId);

  if (!job) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  if (job.freelancerId && job.freelancerId !== req.user.id) {
    return res.status(403).json({ error: 'You are not assigned to this job' });
  }

  job.freelancerId = req.user.id;
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
// Only the client or assigned freelancer can send messages
app.post('/negotiation-message', authMiddleware, (req, res) => {
  const { jobId, message } = req.body;

  if (!jobId || !message) {
    return res.status(400).json({ error: 'jobId and message are required' });
  }

  const job = jobs.find((j) => j.contractId === Number(jobId) || j.contractId === jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const isClient = req.user.role === 'client' && job.clientId === req.user.id;
  const isFreelancer = req.user.role === 'freelancer' && job.freelancerId === req.user.id;

  if (!isClient && !isFreelancer) {
    return res.status(403).json({ error: 'Not authorized for this negotiation' });
  }

  const sender = req.user.role;

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
app.post('/ai-price-suggestion', authMiddleware, async (req, res) => {
  const { jobId } = req.body;

  if (!jobId) {
    return res.status(400).json({ error: 'jobId is required' });
  }

  const job = jobs.find((j) => j.contractId === Number(jobId) || j.contractId === jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const isClient = req.user.role === 'client' && job.clientId === req.user.id;
  const isFreelancer = req.user.role === 'freelancer' && job.freelancerId === req.user.id;
  if (!isClient && !isFreelancer) {
    return res.status(403).json({ error: 'Not authorized for this negotiation' });
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
app.post('/finalize-agreement', authMiddleware, async (req, res) => {
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

  const isClient = req.user.role === 'client' && job.clientId === req.user.id;
  const isFreelancer = req.user.role === 'freelancer' && job.freelancerId === req.user.id;
  if (!isClient && !isFreelancer) {
    return res.status(403).json({ error: 'Not authorized to finalize this agreement' });
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
httpServer.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

