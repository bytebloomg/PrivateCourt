# PrivateCourt

**Confidential Blockchain-Based Dispute Resolution Using Fully Homomorphic Encryption**

PrivateCourt is a revolutionary decentralized application that enables confidential legal proceedings on the blockchain. By leveraging Fully Homomorphic Encryption (FHE), parties can conduct trials where all statements and evidence remain encrypted on-chain while preserving the immutability and transparency benefits of blockchain technology.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Why PrivateCourt?](#why-privatecourt)
- [How It Works](#how-it-works)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Smart Contract Details](#smart-contract-details)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Deployment](#deployment)
  - [Running the Frontend](#running-the-frontend)
- [Usage](#usage)
  - [Creating a Trial](#creating-a-trial)
  - [Sending Encrypted Messages](#sending-encrypted-messages)
  - [Decrypting Messages](#decrypting-messages)
  - [CLI Tasks](#cli-tasks)
- [Testing](#testing)
- [Security Considerations](#security-considerations)
- [Advantages](#advantages)
- [Problems Solved](#problems-solved)
- [Future Roadmap](#future-roadmap)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

---

## Overview

PrivateCourt addresses a critical challenge in blockchain technology: **how to conduct confidential legal proceedings on a public, transparent ledger**. Traditional blockchain applications expose all data publicly, making them unsuitable for sensitive legal matters, arbitration, or dispute resolution where privacy is paramount.

By integrating Zama's FHEVM (Fully Homomorphic Encryption Virtual Machine), PrivateCourt enables:

- **End-to-end encrypted communications** stored immutably on-chain
- **Ephemeral addressing** to anonymize statement authors
- **Permission-based decryption** where only authorized participants can read messages
- **Censorship-resistant records** without revealing content
- **Trustless dispute resolution** without centralized intermediaries

The system supports three-party proceedings: a **judge** who manages the trial and two **disputants** (partyA and partyB) who submit encrypted evidence and arguments.

---

## Key Features

### Core Functionality

- **Confidential Trial Management**: Create trials with designated judges and two parties
- **Encrypted Messaging**: All statements and evidence are encrypted using FHE before being posted on-chain
- **Ephemeral Address Obfuscation**: Each message includes an encrypted randomly-generated address, preventing sender identification
- **Permission-Based Access Control**: Only authorized trial participants can decrypt specific messages
- **Trial Lifecycle Management**: Judges can close trials to prevent further submissions
- **Immutable Audit Trail**: All encrypted communications are permanently recorded on Ethereum Sepolia

### Technical Features

- **Fully Homomorphic Encryption**: Messages remain encrypted on-chain and can only be decrypted by authorized parties
- **FHE Relayer Integration**: Client-side encryption/decryption using Zama's relayer SDK
- **EIP-712 Signature Verification**: Cryptographic proof of decryption authorization without exposing keys
- **WASM-Based Decryption**: Client-side TFHE operations ensure keys never leave the browser
- **Real-time Updates**: Automatic polling for new trials and messages
- **Multi-Wallet Support**: Integration with MetaMask, WalletConnect, and other wallets via RainbowKit

---

## Why PrivateCourt?

### The Problem

Blockchain technology offers transparency, immutability, and decentralization—ideal properties for legal records. However, traditional blockchains expose all data publicly, making them unsuitable for:

- **Confidential arbitration** (commercial disputes with trade secrets)
- **Privacy-sensitive litigation** (personal injury, family law)
- **Regulatory compliance** (GDPR, attorney-client privilege)
- **Witness protection** (preventing retaliation)
- **Sealed court records** (juvenile cases, settlement agreements)

Existing solutions like off-chain storage or centralized encryption break the core value propositions of blockchain: trustlessness and verifiability.

### The Solution

PrivateCourt uses **Fully Homomorphic Encryption** to enable:

1. **Privacy + Transparency**: Encrypted records are publicly visible but remain confidential
2. **Verifiable Confidentiality**: Anyone can verify a record exists without reading its contents
3. **Decentralized Trust**: No central authority holds decryption keys
4. **Immutable Evidence**: Records cannot be altered or deleted after submission
5. **Selective Disclosure**: Parties control who can decrypt their statements

---

## How It Works

### Workflow

```
┌──────────┐                    ┌──────────────────────┐                   ┌───────────────┐
│  Judge   │                    │  Smart Contract      │                   │  Blockchain   │
│          │                    │  (Sepolia)           │                   │               │
└────┬─────┘                    └──────────┬───────────┘                   └───────┬───────┘
     │                                     │                                       │
     │ 1. createTrial(partyA, partyB)     │                                       │
     │───────────────────────────────────>│                                       │
     │                                     │  Store encrypted trial metadata      │
     │                                     │──────────────────────────────────────>│
     │                                     │                                       │
┌────┴─────┐                              │                                       │
│  PartyA  │                              │                                       │
│          │                              │                                       │
└────┬─────┘                              │                                       │
     │ 2. Compose statement (plaintext)   │                                       │
     │    "I demand $10,000 in damages"   │                                       │
     │                                     │                                       │
     │ 3. Generate ephemeral address      │                                       │
     │    (random wallet address)          │                                       │
     │                                     │                                       │
     │ 4. Encrypt with FHE Relayer        │                                       │
     │    - Encrypt message content        │                                       │
     │    - Encrypt ephemeral address      │                                       │
     │    - Generate proof                 │                                       │
     │                                     │                                       │
     │ 5. sendMessage(trialId,            │                                       │
     │       encryptedContent,             │                                       │
     │       encryptedAddress,             │                                       │
     │       proof)                        │                                       │
     │───────────────────────────────────>│                                       │
     │                                     │  Verify proof via Zama Gateway       │
     │                                     │  Store encrypted message             │
     │                                     │──────────────────────────────────────>│
     │                                     │                                       │
┌────┴─────┐                              │                                       │
│  PartyB  │                              │                                       │
│          │                              │                                       │
└────┬─────┘                              │                                       │
     │ 6. Request to decrypt message      │                                       │
     │    Sign EIP-712 verification       │                                       │
     │───────────────────────────────────>│                                       │
     │                                     │  Verify signature                    │
     │                                     │  Check access control (is partyB?)   │
     │                                     │                                       │
     │ 7. Relayer re-encrypts for user    │                                       │
     │<───────────────────────────────────│                                       │
     │                                     │                                       │
     │ 8. Client-side WASM decryption     │                                       │
     │    Display: "I demand $10,000..."  │                                       │
     │                                     │                                       │
```

### Detailed Steps

1. **Trial Creation**: A judge creates a trial by specifying two party addresses. The trial is recorded on-chain with metadata.

2. **Statement Composition**: A participant (judge, partyA, or partyB) composes a statement (maximum 31 characters to fit in bytes32).

3. **Ephemeral Address Generation**: The frontend generates a random wallet address to obfuscate the sender's identity.

4. **Encryption**:
   - The statement is encrypted using Zama's FHE relayer SDK
   - The ephemeral address is also encrypted
   - A cryptographic proof is generated to validate the encryption

5. **On-Chain Submission**: The encrypted message, encrypted address, and proof are submitted to the smart contract via `sendMessage()`.

6. **Decryption Request**: An authorized party requests to decrypt a message by signing an EIP-712 verification message.

7. **Permission Verification**: The relayer verifies the signature and checks that the requester is an authorized participant in the trial.

8. **Re-encryption**: The relayer re-encrypts the message under the requester's public key.

9. **Client-Side Decryption**: The user's browser uses TFHE WASM to decrypt the message locally, ensuring their private key never leaves the client.

---

## Technology Stack

### Smart Contracts

| Technology | Version | Purpose |
|------------|---------|---------|
| **Solidity** | 0.8.27 | Smart contract language |
| **Hardhat** | Latest | Development framework |
| **TypeScript** | 5.8.3 | Type-safe contract scripts |
| **@fhevm/solidity** | Latest | Zama's FHE library for encrypted data types |
| **@fhevm/hardhat-plugin** | Latest | FHE compilation and testing plugin |
| **@zama-fhe/oracle-solidity** | Latest | Oracle for asynchronous decryption |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.1.1 | UI framework |
| **TypeScript** | 5.8.3 | Type safety |
| **Vite** | 7.1.6 | Build tool and dev server |
| **Wagmi** | 2.17.0 | React hooks for Ethereum |
| **RainbowKit** | 2.2.8 | Wallet connection UI |
| **Ethers.js** | 6.15.0 | Contract writes and transactions |
| **Viem** | 2.37.6 | Contract reads and utilities |
| **TanStack Query** | 5.89.0 | Data fetching and caching |
| **@zama-fhe/relayer-sdk** | 0.2.0 | FHE encryption/decryption |

### Network Infrastructure

| Component | Details |
|-----------|---------|
| **Primary Chain** | Ethereum Sepolia Testnet (chainId: 11155111) |
| **Gateway Chain** | Zama Gateway Chain (chainId: 55815) |
| **RPC Provider** | Infura |
| **Wallet Support** | MetaMask, WalletConnect, Coinbase Wallet, etc. |

### Encryption & Privacy

- **TFHE (Torus Fully Homomorphic Encryption)**: Core cryptographic primitive
- **WASM Implementation**: Client-side encryption/decryption in browser
- **EIP-712**: Typed data signing for permission verification
- **Ephemeral Addressing**: Random address generation for sender anonymity

---

## Project Architecture

```
PrivateCourt/
├── contracts/                          # Smart contracts
│   └── ConfidentialCourt.sol           # Main trial management contract
├── deploy/                             # Deployment scripts
│   └── deploy.ts                       # Hardhat deployment script
├── test/                               # Test suites
│   └── ConfidentialCourt.ts            # Contract tests with FHE mocks
├── tasks/                              # Hardhat CLI tasks
│   ├── accounts.ts                     # List account balances
│   └── confidentialCourt.ts            # Contract interaction tasks
├── app/                                # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── CourtApp.tsx            # Main application component
│   │   │   └── Header.tsx              # Navigation header
│   │   ├── config/
│   │   │   ├── contracts.ts            # Contract ABI and addresses
│   │   │   └── wagmi.ts                # Wagmi and RainbowKit config
│   │   ├── hooks/
│   │   │   ├── useZamaInstance.ts      # FHE instance initialization
│   │   │   └── useEthersSigner.ts      # Convert wagmi to ethers signer
│   │   ├── styles/
│   │   │   └── CourtApp.css            # Component styles
│   │   ├── App.tsx                     # React root component
│   │   └── main.tsx                    # Application entry point
│   ├── public/                         # Static assets
│   ├── index.html                      # HTML template
│   ├── package.json                    # Frontend dependencies
│   ├── tsconfig.json                   # TypeScript configuration
│   └── vite.config.ts                  # Vite build configuration
├── docs/                               # Documentation
│   ├── zama_llm.md                     # FHE contract development guide
│   └── zama_doc_relayer.md             # Relayer SDK documentation
├── deployments/                        # Deployment artifacts
│   └── sepolia/                        # Sepolia deployment data
│       ├── ConfidentialCourt.json      # Contract ABI and address
│       └── .chainId                    # Network identifier
├── hardhat.config.ts                   # Hardhat configuration
├── package.json                        # Root dependencies
├── tsconfig.json                       # TypeScript configuration
├── .env                                # Environment variables (gitignored)
├── .gitignore                          # Git ignore rules
├── AGENTS.md                           # Development guidelines
└── README.md                           # This file
```

### Key Components

#### Smart Contract Layer

- **ConfidentialCourt.sol**: Core contract managing trials and encrypted messages
  - Trial creation and lifecycle management
  - Encrypted message storage
  - Access control enforcement
  - Participant indexing for efficient queries

#### Frontend Layer

- **CourtApp.tsx**: Main UI component
  - Trial list display with real-time updates
  - Trial creation form
  - Message submission interface
  - Decryption controls

- **Hooks**: React hooks for blockchain interaction
  - `useZamaInstance`: Initializes FHE instance for encryption/decryption
  - `useEthersSigner`: Bridges wagmi and ethers.js for contract writes

- **Config**: Application configuration
  - Contract addresses and ABIs
  - Wagmi client setup with Sepolia and Gateway chains
  - RainbowKit wallet connection

---

## Smart Contract Details

### ConfidentialCourt.sol

**Inherits**: `SepoliaConfig` (Zama's FHE network configuration)

#### Data Structures

```solidity
struct Trial {
    address judge;        // Trial manager
    address partyA;       // First disputant
    address partyB;       // Second disputant
    bool isActive;        // Trial status (open/closed)
    uint256 createdAt;    // Timestamp of trial creation
}

struct Message {
    address sender;           // Wallet address of sender
    euint256 content;         // Encrypted message content (FHE type)
    eaddress authorAddress;   // Encrypted ephemeral address (FHE type)
    uint256 timestamp;        // Submission timestamp
}
```

#### Key Functions

##### Trial Management

```solidity
function createTrial(address _partyA, address _partyB)
    external
    returns (uint256)
```
- Creates a new trial with the caller as judge
- Returns the trial ID
- Emits `TrialCreated` event

```solidity
function closeTrial(uint256 _trialId)
    external
```
- Closes an active trial (judge only)
- Prevents further message submissions
- Emits `TrialClosed` event

##### Messaging

```solidity
function sendMessage(
    uint256 _trialId,
    inEuint256 calldata _encryptedMessage,
    inEaddress calldata _encryptedAuthorAddress,
    bytes calldata _proof
) external
```
- Submits an encrypted message to a trial
- Only trial participants (judge, partyA, partyB) can send
- Validates proof via Zama's Gateway
- Stores encrypted content and ephemeral address
- Emits `MessageSent` event

##### Query Functions

```solidity
function getTrial(uint256 _trialId)
    external view
    returns (Trial memory)
```

```solidity
function getMessage(uint256 _trialId, uint256 _messageIndex)
    external view
    returns (Message memory)
```

```solidity
function getMessageCount(uint256 _trialId)
    external view
    returns (uint256)
```

```solidity
function getTrialsForAddress(address _account)
    external view
    returns (uint256[] memory)
```

#### FHE Operations

The contract uses Zama's FHE library for encrypted data handling:

- **`FHE.fromExternal(input, proof)`**: Validates and converts external encrypted inputs
- **`FHE.allowThis(ciphertext)`**: Grants the contract access to the ciphertext
- **`FHE.allow(ciphertext, address)`**: Grants a specific address decryption rights
- **Encrypted types**: `euint8`, `euint16`, `euint256`, `eaddress`, `ebool`

#### Access Control

- **Trial Creation**: Anyone can create a trial
- **Message Submission**: Only judge, partyA, or partyB can post messages
- **Trial Closure**: Only the judge can close a trial
- **Decryption**: Controlled off-chain via relayer SDK with EIP-712 signatures

#### Events

```solidity
event TrialCreated(uint256 indexed trialId, address indexed judge, address partyA, address partyB);
event MessageSent(uint256 indexed trialId, address indexed sender, uint256 messageIndex);
event TrialClosed(uint256 indexed trialId);
```

---

## Getting Started

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm/yarn/pnpm**: Package manager
- **MetaMask**: Or another Web3 wallet
- **Sepolia ETH**: For gas fees (get from [Sepolia faucet](https://sepoliafaucet.com/))
- **Infura API Key**: For RPC access (register at [infura.io](https://infura.io))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/PrivateCourt.git
   cd PrivateCourt
   ```

2. **Install root dependencies**

   ```bash
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd app
   npm install
   cd ..
   ```

### Configuration

1. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```bash
   # Private key for contract deployment (without 0x prefix)
   PRIVATE_KEY=your_private_key_here

   # Infura API key for RPC access
   INFURA_API_KEY=your_infura_api_key_here

   # Optional: Etherscan API key for contract verification
   ETHERSCAN_API_KEY=your_etherscan_api_key_here
   ```

   **Security Warning**: Never commit your `.env` file. It's already in `.gitignore`.

2. **Configure Hardhat (optional)**

   The `hardhat.config.ts` is pre-configured for Sepolia. You can modify network settings if needed:

   ```typescript
   networks: {
     sepolia: {
       url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
       accounts: [`0x${process.env.PRIVATE_KEY}`],
     }
   }
   ```

### Deployment

1. **Compile contracts**

   ```bash
   npm run compile
   ```

2. **Deploy to Sepolia testnet**

   ```bash
   npx hardhat deploy --network sepolia
   ```

   The deployment script will:
   - Deploy the `ConfidentialCourt` contract
   - Save the deployment artifacts to `deployments/sepolia/`
   - Display the contract address

3. **Verify contract on Etherscan (optional)**

   ```bash
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

### Running the Frontend

1. **Update contract address (if needed)**

   The frontend automatically reads from `deployments/sepolia/ConfidentialCourt.json`. If you deployed to a different network, update `app/src/config/contracts.ts`.

2. **Start development server**

   ```bash
   cd app
   npm run dev
   ```

3. **Open in browser**

   Navigate to `http://localhost:5173` (or the port shown in terminal)

4. **Connect wallet**

   - Click "Connect Wallet" in the header
   - Select your wallet (MetaMask recommended)
   - Approve the connection
   - Ensure you're on Sepolia testnet

---

## Usage

### Creating a Trial

1. **Via Frontend**:
   - Connect your wallet
   - Enter Party A address
   - Enter Party B address
   - Click "Create Trial"
   - Confirm the transaction in your wallet

   You (the connected wallet) will be the judge.

2. **Via CLI**:
   ```bash
   npx hardhat task:create-trial --party-a 0x123... --party-b 0x456... --network sepolia
   ```

### Sending Encrypted Messages

1. **Via Frontend**:
   - Select a trial from "Your Trials"
   - Type your message (max 31 characters)
   - Click "Send Encrypted Message"
   - Wait for encryption (generates ephemeral address and proof)
   - Confirm transaction

   The message will appear in the trial's message list as encrypted.

2. **Via CLI**:
   ```bash
   npx hardhat task:send-message --trial-id 0 --message "Hello" --network sepolia
   ```

### Decrypting Messages

1. **Via Frontend**:
   - Click "Decrypt" next to an encrypted message
   - Sign the EIP-712 permission request in your wallet
   - Wait for decryption (relayer verifies and re-encrypts)
   - The plaintext message appears

   **Note**: You can only decrypt messages from trials where you're a participant.

2. **Via CLI**:
   ```bash
   npx hardhat task:decrypt-message --trial-id 0 --message-index 0 --network sepolia
   ```

### CLI Tasks

List all available tasks:
```bash
npx hardhat --help
```

#### Court-Specific Tasks

```bash
# Get deployed contract address
npx hardhat task:court-address --network sepolia

# List trials for your address
npx hardhat task:list-trials --network sepolia

# Get trial details
npx hardhat task:get-trial --trial-id 0 --network sepolia

# List all accounts and balances
npx hardhat task:accounts --network sepolia
```

---

## Testing

### Run Tests

```bash
npm test
```

### Test Suite Coverage

The test suite (`test/ConfidentialCourt.ts`) covers:

- ✅ Trial creation with proper participant roles
- ✅ Encrypted message submission
- ✅ Access control (non-participants cannot send messages)
- ✅ Trial closure prevents new messages
- ✅ Judge-only trial closure
- ✅ Participant trial indexing
- ✅ Message count and retrieval

### FHE Testing Environment

Tests use Hardhat's FHE mock environment:
- Simulates encrypted operations without actual FHE computation
- Validates contract logic and access controls
- Fast execution for CI/CD pipelines

For production testing on Sepolia:
```bash
npx hardhat test --network sepolia
```

---

## Security Considerations

### Encryption Security

- **FHE Guarantee**: Messages are encrypted using TFHE, providing semantic security against chosen-plaintext attacks
- **Key Management**: User private keys never leave the client browser (WASM-based decryption)
- **Proof Validation**: All encrypted inputs are verified via Zama's Gateway to prevent malicious ciphertexts

### Smart Contract Security

- **Access Control**: All message submissions checked against trial participant list
- **Reentrancy Protection**: No external calls during state changes
- **Input Validation**: Trial participants must be distinct addresses
- **Event Emission**: All state changes emit events for transparency

### Privacy Considerations

- **Ephemeral Addressing**: Random addresses break sender-message linkage
- **On-Chain Metadata**: Trial participant addresses are public (required for access control)
- **Timing Analysis**: Message timestamps are public, could reveal activity patterns
- **Message Length**: Fixed at 31 characters to prevent length-based inference

### Known Limitations

1. **Message Length**: Limited to 31 characters (bytes32 constraint) to fit in single FHE operation
2. **Gas Costs**: FHE operations are more expensive than plaintext (~10x gas cost)
3. **Decryption Latency**: Asynchronous decryption via relayer adds 2-5 second delay
4. **Network Dependency**: Requires both Sepolia and Zama Gateway to be operational
5. **Beta Status**: Zama's FHEVM is in testnet phase, not production-ready

### Security Best Practices

- **Wallet Security**: Use hardware wallets for production deployments
- **Key Rotation**: Consider implementing key rotation for long-lived trials
- **Backup**: Export trial data regularly (encrypted backups)
- **Auditing**: Contract has not undergone formal security audit
- **Testnet Only**: Currently deployed on Sepolia, not mainnet

---

## Advantages

### 1. **True Confidentiality on Public Blockchain**

Unlike traditional approaches (off-chain storage, zkSNARKs for specific computations), PrivateCourt provides **general-purpose encrypted storage** directly on Ethereum. Data remains encrypted at rest and can only be decrypted by authorized parties.

### 2. **Immutable Audit Trail**

All statements are permanently recorded on-chain. Even if parties later dispute what was said, the encrypted record cannot be altered or deleted. This provides:
- **Non-repudiation**: Participants cannot deny their statements
- **Temporal proof**: Timestamps prove when statements were made
- **Chain of custody**: Complete history of trial proceedings

### 3. **Decentralized Trust**

No central authority controls the system:
- **No trusted intermediary**: Parties interact directly via smart contract
- **Distributed keys**: Each participant holds their own decryption key
- **Censorship resistance**: No entity can block or filter messages
- **Permissionless**: Anyone can create trials without approval

### 4. **Sender Anonymity**

Ephemeral addressing prevents:
- **Retaliation**: Witnesses cannot be identified and targeted
- **Bias**: Messages evaluated on content, not sender identity
- **Correlation attacks**: Cannot link multiple statements from same sender

### 5. **Regulatory Compliance**

Supports legal frameworks requiring:
- **Attorney-client privilege**: Communications remain confidential
- **Sealed records**: Court orders to seal proceedings (judge can close trial)
- **Right to privacy**: GDPR-compliant (data encrypted, not deletable)
- **Evidence preservation**: Meets legal requirements for record retention

### 6. **Composability**

As a smart contract system, PrivateCourt can integrate with:
- **DeFi protocols**: Escrow, staking for bond requirements
- **DAOs**: Decentralized organization dispute resolution
- **NFTs**: Intellectual property disputes, royalty disagreements
- **Identity systems**: Sybil resistance, reputation scores

### 7. **Cost Efficiency**

Compared to traditional arbitration:
- **No venue costs**: Digital-first proceedings
- **Reduced overhead**: No physical security, storage
- **Global access**: Parties participate from anywhere
- **Automated record-keeping**: No stenographer fees

### 8. **Developer-Friendly**

- **Standard Solidity**: Familiar development experience
- **React frontend**: Modern JavaScript ecosystem
- **Extensive tooling**: Hardhat, Wagmi, RainbowKit
- **Clear documentation**: Comprehensive guides and examples

---

## Problems Solved

### 1. **Privacy vs. Transparency Paradox**

**Problem**: Blockchains are transparent by design, but legal proceedings require confidentiality.

**Solution**: FHE allows encrypted data to be stored on-chain. Records are visible (transparent) but unreadable (private) without decryption rights.

### 2. **Sender Identification**

**Problem**: Blockchain transactions expose sender addresses, enabling retaliation or bias.

**Solution**: Ephemeral addresses are generated randomly for each message and encrypted, breaking the link between wallet and statement.

### 3. **Centralized Escrow Services**

**Problem**: Traditional online arbitration relies on trusted third parties (PayPal, Escrow.com) who can censor, freeze funds, or access private data.

**Solution**: Smart contract-based trial management with no trusted intermediary. Parties interact directly with code, not a company.

### 4. **Evidence Tampering**

**Problem**: Digital evidence can be altered, and proving authenticity is difficult.

**Solution**: Blockchain immutability ensures submitted statements cannot be changed after submission. Timestamps prove when evidence was presented.

### 5. **Cross-Border Jurisdiction**

**Problem**: International disputes face conflicting legal systems, enforcement challenges, and high costs.

**Solution**: Blockchain operates globally without borders. Parties can agree to private arbitration regardless of physical location.

### 6. **Access to Justice**

**Problem**: Traditional court systems are expensive, slow, and inaccessible to many.

**Solution**: Decentralized platform with low barriers to entry. Anyone with an Ethereum wallet can participate.

### 7. **Record Retention Costs**

**Problem**: Legal systems require preserving records for decades, incurring storage and security costs.

**Solution**: Ethereum provides permanent storage. Records cannot be lost, destroyed, or corrupted.

### 8. **Key Escrow Risks**

**Problem**: Encrypted communication systems often use key escrow (trusted third party holds decryption keys), creating a single point of failure.

**Solution**: Each participant holds their own keys. No central authority can decrypt messages without user permission.

---

## Future Roadmap

### Phase 1: Current (MVP - Testnet)

✅ Core trial creation and management
✅ Encrypted message submission with ephemeral addressing
✅ Permission-based decryption via relayer
✅ React frontend with wallet integration
✅ Sepolia testnet deployment

### Phase 2: Enhanced Functionality (Q2 2025)

- [ ] **Multi-Message Encryption**: Support longer messages by chunking and encrypting multiple bytes32 values
- [ ] **File Attachments**: Encrypt and store IPFS hashes for documents, images, or videos
- [ ] **Rich Metadata**: Add message types (evidence, argument, objection, ruling) with encrypted labels
- [ ] **Trial Templates**: Pre-configured trial types (arbitration, mediation, jury trial)
- [ ] **Role Extensions**: Add witnesses, attorneys, jury members beyond judge and two parties
- [ ] **Message Threading**: Reply to specific messages with encrypted references
- [ ] **Search & Filtering**: Client-side search after decryption, encrypted tags for categorization

### Phase 3: Advanced Features (Q3 2025)

- [ ] **Voting System**: Jury deliberation with encrypted ballots, threshold decryption for verdicts
- [ ] **Escrow Integration**: Lock funds in smart contract, release based on trial outcome
- [ ] **Time-Locked Decryption**: Automatic decryption after a specified date (for sealed records)
- [ ] **Key Recovery**: Social recovery or Shamir secret sharing for lost keys
- [ ] **Multi-Signature Authorization**: Require multiple parties to approve message decryption
- [ ] **Deadline Management**: Enforce submission deadlines, automatic trial closure
- [ ] **Notification System**: On-chain or off-chain alerts for new messages

### Phase 4: Mainnet & Ecosystem (Q4 2025)

- [ ] **Mainnet Deployment**: Launch on Ethereum mainnet after security audit
- [ ] **Layer 2 Support**: Deploy on Optimism, Arbitrum, zkSync for lower gas costs
- [ ] **DAO Integration**: Governance token for protocol upgrades, fee distribution
- [ ] **Reputation System**: On-chain reputation scores for judges, mediators
- [ ] **Marketplace**: Discovery platform for finding arbitrators, posting disputes
- [ ] **Legal Framework Integration**: Partner with legal tech companies for enforceability
- [ ] **Insurance Products**: Crypto-native insurance for dispute resolution outcomes

### Phase 5: Research & Innovation (2026+)

- [ ] **Zero-Knowledge Proofs**: Combine FHE with zk-SNARKs for verifiable computation on encrypted data
- [ ] **Programmable Privacy**: Smart contracts that compute on encrypted trial data (e.g., automatic verdict calculation)
- [ ] **Cross-Chain Bridges**: Resolve disputes involving assets on multiple blockchains
- [ ] **AI Judge Assistants**: Machine learning models trained on encrypted case law
- [ ] **Anonymous Credentials**: Prove qualifications (attorney license) without revealing identity
- [ ] **Threshold FHE**: Distribute decryption keys across multiple parties for added security
- [ ] **Quantum Resistance**: Upgrade to post-quantum cryptographic primitives

### Community & Governance

- [ ] **Bug Bounty Program**: Incentivize security researchers to find vulnerabilities
- [ ] **Developer Grants**: Fund community-built features, integrations
- [ ] **Academic Partnerships**: Collaborate with universities on FHE research
- [ ] **Open Standards**: Propose EIPs (Ethereum Improvement Proposals) for FHE standards
- [ ] **Decentralized Governance**: Transition to DAO for protocol decisions

### Documentation & Education

- [ ] **Video Tutorials**: Walkthrough guides for using PrivateCourt
- [ ] **Legal Templates**: Sample dispute resolution agreements, arbitration clauses
- [ ] **Integration Guides**: How to embed PrivateCourt in existing dApps
- [ ] **Case Studies**: Real-world examples of successful resolutions
- [ ] **Developer Workshop**: Online courses for building FHE applications

---

## Documentation

### Official Documentation

- **Zama FHEVM Documentation**: [https://docs.zama.ai/fhevm](https://docs.zama.ai/fhevm)
- **FHEVM Hardhat Plugin**: [https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)
- **Relayer SDK Guide**: See `docs/zama_doc_relayer.md`
- **FHE Contract Patterns**: See `docs/zama_llm.md`

### Guides

- **Getting Started**: [Quick Start Tutorial](https://docs.zama.ai/protocol/solidity-guides/getting-started/quick-start-tutorial)
- **Writing FHE Contracts**: [Solidity Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/solidity-guide)
- **Testing**: [Hardhat Testing Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)
- **Deployment**: [Network Setup](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)

### API Reference

- **Contract ABI**: See `deployments/sepolia/ConfidentialCourt.json`
- **Frontend Types**: See `app/src/config/contracts.ts`
- **Wagmi Hooks**: [https://wagmi.sh/react/api/hooks](https://wagmi.sh/react/api/hooks)
- **RainbowKit**: [https://www.rainbowkit.com/docs/installation](https://www.rainbowkit.com/docs/installation)

### Community Resources

- **Zama Discord**: [https://discord.gg/zama](https://discord.gg/zama)
- **GitHub Issues**: [Report bugs](https://github.com/yourusername/PrivateCourt/issues)
- **Discussions**: [Community forum](https://github.com/yourusername/PrivateCourt/discussions)

---

## Contributing

We welcome contributions from the community! Here's how you can help:

### Reporting Bugs

1. Check [existing issues](https://github.com/yourusername/PrivateCourt/issues) to avoid duplicates
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs. actual behavior
   - Screenshots/logs if applicable
   - Environment details (browser, wallet, OS)

### Suggesting Features

1. Open a [discussion](https://github.com/yourusername/PrivateCourt/discussions) to propose the feature
2. Describe the use case and benefits
3. Gather community feedback before implementation

### Submitting Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/my-awesome-feature
   ```
3. **Make your changes**
   - Follow existing code style
   - Add tests for new functionality
   - Update documentation
4. **Run tests**
   ```bash
   npm test
   npm run lint
   ```
5. **Commit with clear messages**
   ```bash
   git commit -m "Add feature: short description"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/my-awesome-feature
   ```
7. **Open a Pull Request**
   - Reference any related issues
   - Describe what changed and why
   - Include screenshots for UI changes

### Development Guidelines

- **Code Style**: Follow the existing TypeScript/Solidity conventions
- **Testing**: Maintain 80%+ test coverage
- **Documentation**: Update README and inline comments
- **Security**: Never commit private keys or API keys
- **Commits**: Use conventional commit messages (feat, fix, docs, refactor, test)

### Areas Needing Help

- 🐛 Bug fixes and testing
- 📚 Documentation improvements
- 🌍 Internationalization (i18n)
- ♿ Accessibility enhancements
- 🎨 UI/UX design
- 🔒 Security audits
- 📊 Gas optimization

---

## License

This project is licensed under the **BSD-3-Clause-Clear License**. See the [LICENSE](LICENSE) file for details.

### What This Means

- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ No patent grant
- ❌ No trademark grant
- ⚠️ Liability limited
- ⚠️ Warranty disclaimed

### Third-Party Licenses

- **Zama FHEVM**: BSD-3-Clause-Clear
- **Hardhat**: MIT
- **React**: MIT
- **Wagmi**: MIT
- **RainbowKit**: MIT

---

## Support

### Getting Help

- **Documentation**: Start with this README and `docs/` folder
- **GitHub Issues**: [Technical problems](https://github.com/yourusername/PrivateCourt/issues)
- **Discussions**: [Questions and ideas](https://github.com/yourusername/PrivateCourt/discussions)
- **Zama Discord**: [FHE-specific questions](https://discord.gg/zama)

### Contact

- **Email**: support@privatecourt.io (if available)
- **Twitter**: [@PrivateCourtHQ](https://twitter.com/PrivateCourtHQ) (if available)
- **Website**: https://privatecourt.io (if available)

### Acknowledgments

Built with:
- **Zama**: For pioneering FHEVM technology
- **Ethereum Foundation**: For Sepolia testnet
- **Hardhat**: For excellent development tooling
- **Wagmi/RainbowKit**: For seamless wallet integration

Special thanks to the Zama team for their support and documentation.

---

## Disclaimer

**EXPERIMENTAL SOFTWARE - USE AT YOUR OWN RISK**

PrivateCourt is currently in **beta/testnet** phase. The software is provided "as-is" without warranties of any kind.

⚠️ **Important Warnings**:

1. **Not Production-Ready**: This is experimental software. Do not use for real legal proceedings with significant value at stake.
2. **No Legal Advice**: This software does not constitute legal advice. Consult a licensed attorney for legal matters.
3. **No Audits**: Smart contracts have not undergone formal security audits. Use at your own risk.
4. **Testnet Only**: Currently deployed on Sepolia testnet. Mainnet deployment pending further testing and audits.
5. **Gas Costs**: FHE operations are expensive. Budget accordingly for mainnet usage.
6. **Key Management**: You are responsible for securing your private keys. Lost keys cannot be recovered.
7. **Regulatory Uncertainty**: Legal enforceability of blockchain-based arbitration varies by jurisdiction.
8. **Beta Technology**: Zama's FHEVM is cutting-edge technology still under active development.

By using PrivateCourt, you acknowledge these risks and agree to use the software responsibly.

---

**Built with privacy, powered by mathematics, secured by blockchain.**

*PrivateCourt - Justice in the Digital Age*
