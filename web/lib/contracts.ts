/**
 * Network variables and Package IDs.
 * Define them here as a standard constant object.
 * 
 * @example
 * ```tsx
 * const network = useCurrentNetwork() as SupportedNetwork;
 * const packageId = NETWORK_VARIABLES[network].packageId;
 * 
 * const tx = new Transaction();
 * tx.moveCall({
 *   target: `${packageId}::profile::create_profile`,
 *   arguments: [tx.pure.string("Alice")],
 * });
 * ```
 */
export const NETWORK_VARIABLES = {
  mainnet: {
    packageId: process.env.NEXT_PUBLIC_MAINNET_PACKAGE_ID || "",
    // Add other mainnet variables here (e.g., specific object IDs)
  },
  testnet: {
    packageId: process.env.NEXT_PUBLIC_TESTNET_PACKAGE_ID || "",
    // Add other testnet variables here
  },
} as const;

export type SupportedNetwork = keyof typeof NETWORK_VARIABLES;
