/**
 * Global application providers wrapper.
 * This file wraps the entire React application to provide global state.
 * It initializes:
 * 1. TanStack Query (for data fetching and caching)
 * 2. dAppKit (for Sui network interaction and wallet connections)
 * 3. Enoki (for Google zkLogin injection into the wallet list)
 */

"use client";
import { DAppKitProvider, useCurrentClient, useCurrentNetwork } from '@mysten/dapp-kit-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { dAppKit } from '@/lib/dapp-kit';
import { useState, useEffect } from 'react';
import { isEnokiNetwork, registerEnokiWallets } from '@mysten/enoki';

function EnokiInit() {
  const client = useCurrentClient();
  const network = useCurrentNetwork();

  useEffect(() => {
    if (!isEnokiNetwork(network)) return;

    const { unregister } = registerEnokiWallets({
      apiKey: process.env.NEXT_PUBLIC_ENOKI_API_KEY || '',
      providers: {
        google: { clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '' },
      },
      client: client as any,
      network,
    });

    return unregister;
  }, [client, network]);

  return null;
}

// Using a factory to ensure QueryClient is only created once per client session
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <DAppKitProvider dAppKit={dAppKit}>
        <EnokiInit />
        {children}
      </DAppKitProvider>
    </QueryClientProvider>
  );
}
