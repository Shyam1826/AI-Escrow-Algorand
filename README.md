# AI Escrow Marketplace (Algorand)

An AI-powered decentralized escrow platform that enables secure freelance transactions using blockchain and intelligent contract generation.

Built for **AlgoBharat Hack Series 3.0**.

---

## Problem

Freelance marketplaces often suffer from:

* Payment disputes between clients and freelancers
* Lack of transparent contract terms
* Delayed or unfair payments
* Centralized control of escrow funds

Our platform solves these issues by combining **AI-generated contracts** with **blockchain escrow**.

---

## Solution

AI Escrow Marketplace allows clients and freelancers to:

1. Create jobs and negotiate terms in a private chat
2. Finalize an agreement collaboratively
3. Automatically generate a structured contract using AI
4. Lock funds into blockchain escrow
5. Release payment only after successful delivery

This ensures **trustless, transparent, and automated freelance payments**.

---

## Key Features

### AI Contract Generation

* Converts negotiated terms into a structured freelance contract
* Generates scope of work, payment terms, and delivery conditions

### Negotiation Chat

* Private chat between client and freelancer
* Both parties decide the final price and scope

### Blockchain Escrow

* Funds locked securely using **Algorand**
* Payments released only after successful delivery

### Wallet Integration

* Secure wallet connection using **Pera Wallet**

### Dispute Prevention

* Clear contract terms reduce conflicts
* Transparent escrow process

---

## Workflow

Client creates job
↓
Freelancer joins negotiation chat
↓
Both agree on final price and scope
↓
AI generates the official contract
↓
Client deposits escrow funds on Algorand
↓
Freelancer submits work
↓
Client releases payment or requests refund

---

## Tech Stack

Frontend

* React
* Vite
* TailwindCSS

Backend

* Node.js
* Express

Blockchain

* Algorand SDK

AI

* OpenAI API

Wallet

* Pera Wallet Connect

---

## Project Structure

```
AI-Escrow-Algorand
│
├── frontend
│   ├── src
│   └── vite.config.mts
│
├── backend
│   ├── services
│   │   ├── aiService.js
│   │   └── algorandService.js
│   └── server.js
│
└── README.md
```

---

## Installation

Clone the repository

```
git clone https://github.com/shyam1826/AI-Escrow-Algorand.git
cd AI-Escrow-Algorand
```

### Backend

```
cd backend
npm install
npm run dev
```

### Frontend

```
cd frontend
npm install
npm run dev
```

Open in browser:

```
http://localhost:5173
```

---

## Environment Variables

Create a `.env` file in the backend folder.

```
OPENAI_API_KEY=your_api_key_here
```

---

## Future Improvements

* Smart contract escrow automation
* Reputation system for freelancers
* AI-based dispute resolution
* Milestone-based payments
* On-chain contract storage

---

## Hackathon

This project was built for **AlgoBharat Hack Series 3.0** to demonstrate how **AI + Blockchain** can enable trustless freelance marketplaces.

---

## License

MIT License
