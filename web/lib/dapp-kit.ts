/**
 * Core Sui network configuration.
 * Defines supported networks and sets up the `SuiGrpcClient` which handles
 * communication with the blockchain.
 * Exports `dAppKit` instance for the providers wrapper.
 * 
 * @example
 * ```tsx
 * const client = useCurrentClient();
 * const balance = await client.getBalance({ owner: "0x123..." });
 * ```
 */
import { createDAppKit } from '@mysten/dapp-kit-react';
import { SuiGrpcClient } from '@mysten/sui/grpc';

const GRPC_URLS: Record<string, string> = {
  mainnet: 'https://fullnode.mainnet.sui.io:443',
  testnet: 'https://fullnode.testnet.sui.io:443',
};

export const dAppKit = createDAppKit({
  networks: ['testnet', 'mainnet'],
  defaultNetwork: 'testnet',
  createClient: (network) =>
    new SuiGrpcClient({ network, baseUrl: GRPC_URLS[network] }),
});

declare module '@mysten/dapp-kit-react' {
  interface Register {
    dAppKit: typeof dAppKit;
  }
}
