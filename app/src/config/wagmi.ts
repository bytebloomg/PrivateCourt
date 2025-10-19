import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  // eslint-disable-next-line no-console
  console.warn('VITE_WALLETCONNECT_PROJECT_ID is not set. WalletConnect may fail to initialize.');
}

export const config = getDefaultConfig({
  appName: 'Confidential Court',
  projectId: projectId || '00000000000000000000000000000000',
  chains: [sepolia],
  ssr: false,
});
