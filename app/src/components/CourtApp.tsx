import { useEffect, useMemo, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';

import { Header } from './Header';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import '../styles/CourtApp.css';

type Trial = {
  id: string;
  judge: string;
  partyA: string;
  partyB: string;
  isActive: boolean;
  createdAt: number;
  messageCount: number;
};

type MessageEntry = {
  index: number;
  sender: string;
  encryptedContent: string;
  encryptedAuthor: string;
  timestamp: number;
};

type DecryptedMessage = {
  message: string;
  ephemeral: string;
};

function TrialCreationForm({
  onCreate,
  isSubmitting,
  error,
}: {
  onCreate: (partyA: string, partyB: string) => Promise<boolean>;
  isSubmitting: boolean;
  error: string | null;
}) {
  const [partyA, setPartyA] = useState('');
  const [partyB, setPartyB] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const success = await onCreate(partyA.trim(), partyB.trim());
    if (success) {
      setPartyA('');
      setPartyB('');
    }
  };

  return (
    <section className="card">
      <h2 className="card-title">Open New Trial</h2>
      <p className="card-description">
        Specify both parties to create a confidential hearing with you as the judge.
      </p>
      <form className="form" onSubmit={handleSubmit}>
        <label className="form-label">
          Party A Address
          <input
            value={partyA}
            onChange={(event) => setPartyA(event.target.value)}
            placeholder="0x..."
            className="form-input"
            required
          />
        </label>
        <label className="form-label">
          Party B Address
          <input
            value={partyB}
            onChange={(event) => setPartyB(event.target.value)}
            placeholder="0x..."
            className="form-input"
            required
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Trial'}
        </button>
      </form>
    </section>
  );
}

function TrialsPanel({
  trials,
  activeTrialId,
  onSelect,
}: {
  trials: Trial[];
  activeTrialId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="card">
      <h2 className="card-title">My Trials</h2>
      {trials.length === 0 ? (
        <p className="empty-state">No trials yet. Create one to begin a hearing.</p>
      ) : (
        <ul className="trial-list">
          {trials.map((trial) => (
            <li key={trial.id} className={`trial-item ${activeTrialId === trial.id ? 'selected' : ''}`}>
              <button type="button" onClick={() => onSelect(trial.id)} className="trial-button">
                <div className="trial-header">
                  <span className="trial-id">Trial #{trial.id}</span>
                  <span className={`trial-status ${trial.isActive ? 'active' : 'closed'}`}>
                    {trial.isActive ? 'Active' : 'Closed'}
                  </span>
                </div>
                <dl className="trial-meta">
                  <div>
                    <dt>Judge</dt>
                    <dd>{trial.judge}</dd>
                  </div>
                  <div>
                    <dt>Party A</dt>
                    <dd>{trial.partyA}</dd>
                  </div>
                  <div>
                    <dt>Party B</dt>
                    <dd>{trial.partyB}</dd>
                  </div>
                </dl>
                <div className="trial-footer">
                  <span>{trial.messageCount} messages</span>
                  <span>{new Date(trial.createdAt * 1000).toLocaleString()}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MessageItem({
  entry,
  decrypted,
  onDecrypt,
  decrypting,
}: {
  entry: MessageEntry;
  decrypted: DecryptedMessage | undefined;
  onDecrypt: () => void;
  decrypting: boolean;
}) {
  return (
    <li className="message-item">
      <div className="message-header">
        <span className="message-index">#{entry.index + 1}</span>
        <span className="message-sender">From {entry.sender}</span>
        <span className="message-time">{new Date(entry.timestamp * 1000).toLocaleString()}</span>
      </div>
      {decrypted ? (
        <div className="message-body">
          <p className="message-text">{decrypted.message}</p>
          <p className="message-ephemeral">Ephemeral address: {decrypted.ephemeral}</p>
        </div>
      ) : (
        <div className="message-body">
          <p className="message-text">Encrypted message</p>
          <button className="secondary-button" onClick={onDecrypt} disabled={decrypting}>
            {decrypting ? 'Decrypting...' : 'Decrypt message'}
          </button>
        </div>
      )}
    </li>
  );
}

export function CourtApp() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const signer = useEthersSigner();
  const { instance, isLoading: zamaLoading, error: zamaError } = useZamaInstance();
  const queryClient = useQueryClient();

  const [selectedTrialId, setSelectedTrialId] = useState<string | null>(null);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [composerError, setComposerError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [decryptingIndex, setDecryptingIndex] = useState<number | null>(null);
  const [decryptedMessages, setDecryptedMessages] = useState<Record<number, DecryptedMessage>>({});
  const [lastEphemeral, setLastEphemeral] = useState<string | null>(null);

  const contractConfigured = ethers.isAddress(CONTRACT_ADDRESS);

  const trialsQuery = useQuery({
    queryKey: ['trials', address],
    enabled: Boolean(address && publicClient && contractConfigured),
    refetchInterval: 10000,
    queryFn: async (): Promise<Trial[]> => {
      if (!publicClient || !address || !contractConfigured) {
        return [];
      }

      const trialIds = (await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getTrialsForAddress',
        args: [address],
      })) as readonly bigint[];

      if (!trialIds.length) {
        return [];
      }

      const trials = await Promise.all(
        trialIds.map(async (trialId) => {
          const details = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'getTrial',
            args: [trialId],
          });

          const [judge, partyA, partyB, isActive, createdAt, messageCount] = details as readonly [
            string,
            string,
            string,
            boolean,
            bigint,
            bigint,
          ];

          return {
            id: trialId.toString(),
            judge,
            partyA,
            partyB,
            isActive,
            createdAt: Number(createdAt),
            messageCount: Number(messageCount),
          } satisfies Trial;
        }),
      );

      return trials.sort((a, b) => Number(b.id) - Number(a.id));
    },
  });

  const trials = trialsQuery.data ?? [];

  useEffect(() => {
    if (trials.length > 0) {
      setSelectedTrialId((current) => current ?? trials[0].id);
    } else {
      setSelectedTrialId(null);
    }
  }, [trials]);

  const messagesQuery = useQuery({
    queryKey: ['messages', selectedTrialId],
    enabled: Boolean(selectedTrialId && publicClient && contractConfigured),
    refetchInterval: 8000,
    queryFn: async (): Promise<MessageEntry[]> => {
      if (!selectedTrialId || !publicClient || !contractConfigured) {
        return [];
      }

      const messageCount = (await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getMessageCount',
        args: [BigInt(selectedTrialId)],
      })) as bigint;

      const total = Number(messageCount);
      if (total === 0) {
        return [];
      }

      const items = await Promise.all(
        Array.from({ length: total }, (_, index) => index).map(async (index) => {
          const result = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'getMessage',
            args: [BigInt(selectedTrialId), BigInt(index)],
          });

          const [sender, encryptedContent, encryptedAuthorAddress, timestamp] = result as readonly [
            string,
            string,
            string,
            bigint,
          ];

          return {
            index,
            sender,
            encryptedContent,
            encryptedAuthor: encryptedAuthorAddress,
            timestamp: Number(timestamp),
          } satisfies MessageEntry;
        }),
      );

      return items;
    },
  });

  const messages = messagesQuery.data ?? [];

  useEffect(() => {
    setDecryptedMessages({});
    setLastEphemeral(null);
  }, [selectedTrialId]);

  const activeTrial = useMemo(() => trials.find((item) => item.id === selectedTrialId) ?? null, [
    trials,
    selectedTrialId,
  ]);

  const handleCreateTrial = async (partyA: string, partyB: string): Promise<boolean> => {
    if (!isConnected || !address) {
      setCreationError('Connect your wallet before creating a trial.');
      return false;
    }
    if (!ethers.isAddress(partyA) || !ethers.isAddress(partyB)) {
      setCreationError('Both parties must be valid addresses.');
      return false;
    }
    if (partyA.toLowerCase() === partyB.toLowerCase()) {
      setCreationError('Party addresses must be different.');
      return false;
    }
    setCreationError(null);
    setIsCreating(true);

    try {
      const resolvedSigner = await signer;
      if (!resolvedSigner) {
        throw new Error('Wallet signer unavailable');
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, resolvedSigner) as any;
      const trialId = await contract.callStatic.createTrial(partyA, partyB);
      const tx = await contract.createTrial(partyA, partyB);
      await tx.wait();

      setSelectedTrialId(trialId.toString());
      await queryClient.invalidateQueries({ queryKey: ['trials', address] });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create trial';
      setCreationError(message);
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!activeTrial || !address) {
      setComposerError('Select a trial before sending messages.');
      return;
    }
    if (!instance) {
      setComposerError('Encryption service is not ready yet.');
      return;
    }

    const trimmed = messageText.trim();
    if (!trimmed) {
      setComposerError('Message cannot be empty.');
      return;
    }
    if (trimmed.length > 31) {
      setComposerError('Message must be 31 characters or fewer.');
      return;
    }

    setComposerError(null);
    setIsSending(true);

    try {
      const paddedMessage = ethers.encodeBytes32String(trimmed);
      const messageBigInt = BigInt(paddedMessage);
      const ephemeralWallet = ethers.Wallet.createRandom();

      const buffer = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
      buffer.add256(messageBigInt);
      buffer.addAddress(ephemeralWallet.address);
      const ciphertext = await buffer.encrypt();

      const resolvedSigner = await signer;
      if (!resolvedSigner) {
        throw new Error('Wallet signer unavailable');
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, resolvedSigner) as any;
      const tx = await contract.sendMessage(
        BigInt(activeTrial.id),
        ciphertext.handles[0],
        ciphertext.handles[1],
        ciphertext.inputProof,
      );
      await tx.wait();

      setMessageText('');
      setLastEphemeral(ephemeralWallet.address);
      setDecryptedMessages({});

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['messages', activeTrial.id] }),
        queryClient.invalidateQueries({ queryKey: ['trials', address] }),
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send message';
      setComposerError(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleDecryptMessage = async (entry: MessageEntry) => {
    if (!instance || !address) {
      setComposerError('Encryption service is not ready.');
      return;
    }
    setDecryptingIndex(entry.index);

    try {
      const keypair = instance.generateKeypair();
      const handles = [
        { handle: entry.encryptedContent, contractAddress: CONTRACT_ADDRESS },
        { handle: entry.encryptedAuthor, contractAddress: CONTRACT_ADDRESS },
      ];

      const startTimestamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';
      const contractAddresses = [CONTRACT_ADDRESS];

      const eip712 = instance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimestamp,
        durationDays,
      );

      const resolvedSigner = await signer;
      if (!resolvedSigner) {
        throw new Error('Wallet signer unavailable');
      }

      const signature = await resolvedSigner.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message,
      );

      const result = await instance.userDecrypt(
        handles,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        address,
        startTimestamp,
        durationDays,
      );

      const rawMessage = result[entry.encryptedContent];
      if (rawMessage === undefined) {
        throw new Error('Unable to decrypt message content');
      }

      const messageValue = typeof rawMessage === 'bigint' ? rawMessage : BigInt(rawMessage);
      const messageHex = ethers.zeroPadValue(ethers.toBeHex(messageValue), 32);
      const decryptedMessage = ethers.decodeBytes32String(messageHex);

      const rawAddress = result[entry.encryptedAuthor];
      if (rawAddress === undefined) {
        throw new Error('Unable to decrypt ephemeral address');
      }

      const decryptedAddress =
        typeof rawAddress === 'string'
          ? ethers.getAddress(rawAddress)
          : ethers.getAddress(ethers.zeroPadValue(ethers.toBeHex(rawAddress), 20));

      setDecryptedMessages((prev) => ({
        ...prev,
        [entry.index]: { message: decryptedMessage, ephemeral: decryptedAddress },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to decrypt message';
      setComposerError(message);
    } finally {
      setDecryptingIndex(null);
    }
  };

  if (!contractConfigured) {
    return (
      <div className="app-shell">
        <Header />
        <main className="layout">
          <section className="card">
            <h2 className="card-title">Contract configuration missing</h2>
            <p className="card-description">
              Set <code>VITE_CONFIDENTIAL_COURT_ADDRESS</code> before using the application.
            </p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="layout">
        {!isConnected ? (
          <section className="card">
            <h2 className="card-title">Connect your wallet</h2>
            <p className="card-description">
              Connect a wallet on Sepolia to create trials and exchange encrypted statements.
            </p>
          </section>
        ) : (
          <div className="grid">
            <div className="left-column">
              <TrialCreationForm onCreate={handleCreateTrial} isSubmitting={isCreating} error={creationError} />
              <TrialsPanel
                trials={trials}
                activeTrialId={selectedTrialId}
                onSelect={(id) => setSelectedTrialId(id)}
              />
            </div>

            <section className="card right-column">
              <div className="messages-header">
                <h2 className="card-title">Encrypted Messages</h2>
                {activeTrial ? (
                  <div className="messages-meta">
                    <span>Trial #{activeTrial.id}</span>
                    <span>{activeTrial.isActive ? 'Open for submissions' : 'Closed'}</span>
                  </div>
                ) : null}
              </div>

              {zamaError ? <p className="form-error">{zamaError}</p> : null}

              {messages.length === 0 ? (
                <p className="empty-state">No messages yet for this trial.</p>
              ) : (
                <ul className="message-list">
                  {messages.map((entry) => (
                    <MessageItem
                      key={entry.index}
                      entry={entry}
                      decrypted={decryptedMessages[entry.index]}
                      decrypting={decryptingIndex === entry.index}
                      onDecrypt={() => handleDecryptMessage(entry)}
                    />
                  ))}
                </ul>
              )}

              <div className="composer">
                <label className="form-label">
                  Write a statement
                  <textarea
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    placeholder="Enter up to 31 characters"
                    maxLength={31}
                    className="form-input text-area"
                    disabled={!activeTrial || isSending || zamaLoading}
                  />
                </label>
                {composerError ? <p className="form-error">{composerError}</p> : null}
                {lastEphemeral ? (
                  <p className="composer-info">Last generated ephemeral address: {lastEphemeral}</p>
                ) : null}
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleSendMessage}
                  disabled={!activeTrial || isSending || zamaLoading}
                >
                  {zamaLoading ? 'Initializing encryption...' : isSending ? 'Sending...' : 'Send encrypted message'}
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
