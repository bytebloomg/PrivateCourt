// const rawAddress = (import.meta.env.VITE_CONFIDENTIAL_COURT_ADDRESS ?? '') as string;

export const CONTRACT_ADDRESS = '0xafF7967d25ecad338b0804E3c59F7DEE7dFAfA4E';

export const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "DuplicateParty",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MessageOutOfBounds",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotJudge",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SenderNotParticipant",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TrialAlreadyClosed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TrialDoesNotExist",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAddress",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "trialId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "messageIndex",
        "type": "uint256"
      }
    ],
    "name": "MessagePosted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "trialId",
        "type": "uint256"
      }
    ],
    "name": "TrialClosed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "trialId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "judge",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "partyA",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "partyB",
        "type": "address"
      }
    ],
    "name": "TrialCreated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "trialId",
        "type": "uint256"
      }
    ],
    "name": "closeTrial",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "partyA",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "partyB",
        "type": "address"
      }
    ],
    "name": "createTrial",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "trialId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "trialId",
        "type": "uint256"
      }
    ],
    "name": "getMessageCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "trialId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "getMessage",
    "outputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "euint256",
        "name": "encryptedContent",
        "type": "bytes32"
      },
      {
        "internalType": "eaddress",
        "name": "encryptedAuthorAddress",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "trialId",
        "type": "uint256"
      }
    ],
    "name": "getTrial",
    "outputs": [
      {
        "internalType": "address",
        "name": "judge",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "partyA",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "partyB",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "createdAt",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "messageCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "getTrialsForAddress",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "trialId",
        "type": "uint256"
      },
      {
        "internalType": "externalEuint256",
        "name": "encryptedMessage",
        "type": "bytes32"
      },
      {
        "internalType": "externalEaddress",
        "name": "encryptedAuthorAddress",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "sendMessage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
