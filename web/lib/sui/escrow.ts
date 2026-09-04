import { Transaction } from "@mysten/sui/transactions";

/**
 * Sui Escrow smart contract integration constants and PTB builders.
 */

export const SUI_CLOCK_OBJECT_ID = "0x6";
export const SUI_COIN_TYPE = "0x2::sui::SUI";

// Testnet package ID from environment
export const TESTNET_PACKAGE_ID = process.env.NEXT_PUBLIC_TESTNET_PACKAGE_ID || "";

// In Testnet mode, we scale USD values so a standard 1 SUI faucet drop can fund full test projects.
// 100,000 MIST per $1 USD -> $3,000 USD project = 300,000,000 MIST = 0.3 SUI
export const MIST_PER_USD = 100_000n;

/**
 * Convert USD amount to MIST (base SUI units).
 * Ensures at least 1,000 MIST.
 */
export function usdToMist(usd: number): bigint {
  const mist = BigInt(Math.max(1, Math.round(usd))) * MIST_PER_USD;
  return mist > 0n ? mist : 1000n;
}

/**
 * Explorer link helpers for Suiscan
 */
export function getSuiscanTxUrl(digest: string, network = "testnet"): string {
  return `https://suiscan.xyz/${network}/tx/${digest}`;
}

export function getSuiscanObjectUrl(objectId: string, network = "testnet"): string {
  return `https://suiscan.xyz/${network}/object/${objectId}`;
}

export function formatSuiAddress(address: string): string {
  if (!address) return "";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export interface CreateEscrowParams {
  packageId?: string;
  projectId: string;
  freelancerAddress: string;
  milestones: {
    id: number;
    title: string;
    deliverable: string;
    amountUsd: number;
    deadlineMs?: number;
  }[];
  gonkaMatchRequestId?: string;
}

/**
 * Builds a Programmable Transaction Block (PTB) to call `trusthire::escrow::create_escrow<0x2::sui::SUI>`
 */
export function buildCreateEscrowTx(params: CreateEscrowParams): Transaction {
  const packageId = params.packageId || TESTNET_PACKAGE_ID;
  if (!packageId) {
    throw new Error("Cannot build create_escrow transaction: NEXT_PUBLIC_TESTNET_PACKAGE_ID is not configured.");
  }

  const tx = new Transaction();

  // 1. Calculate milestone MIST amounts and total deposit
  const milestoneIds: bigint[] = [];
  const milestoneTitles: string[] = [];
  const milestoneDeliverables: string[] = [];
  const milestoneAmounts: bigint[] = [];
  const milestoneDeadlines: bigint[] = [];

  let totalMist = 0n;

  params.milestones.forEach((m, idx) => {
    const mist = usdToMist(m.amountUsd);
    milestoneIds.push(BigInt(m.id ?? idx));
    milestoneTitles.push(m.title || `Milestone ${idx + 1}`);
    milestoneDeliverables.push(m.deliverable || "Milestone deliverable");
    milestoneAmounts.push(mist);
    milestoneDeadlines.push(BigInt(m.deadlineMs || 0));
    totalMist += mist;
  });

  // 2. Split the required SUI coins from tx.gas
  const [depositCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(totalMist)]);

  // 3. Invoke trusthire::escrow::create_escrow<0x2::sui::SUI>
  tx.moveCall({
    target: `${packageId}::escrow::create_escrow`,
    typeArguments: [SUI_COIN_TYPE],
    arguments: [
      tx.pure.string(params.projectId),
      tx.pure.address(params.freelancerAddress),
      depositCoin,
      tx.pure.vector("u64", milestoneIds),
      tx.pure.vector("string", milestoneTitles),
      tx.pure.vector("string", milestoneDeliverables),
      tx.pure.vector("u64", milestoneAmounts),
      tx.pure.vector("u64", milestoneDeadlines),
      tx.pure.string(params.gonkaMatchRequestId || "mock-gonka-req-001"),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

export interface SubmitMilestoneParams {
  packageId?: string;
  escrowObjectId: string;
  milestoneId: number;
}

/**
 * Builds a PTB to call `trusthire::escrow::submit_milestone<0x2::sui::SUI>`
 */
export function buildSubmitMilestoneTx(params: SubmitMilestoneParams): Transaction {
  const packageId = params.packageId || TESTNET_PACKAGE_ID;
  if (!packageId) {
    throw new Error("Cannot build submit_milestone transaction: NEXT_PUBLIC_TESTNET_PACKAGE_ID is not configured.");
  }

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::escrow::submit_milestone`,
    typeArguments: [SUI_COIN_TYPE],
    arguments: [
      tx.object(params.escrowObjectId),
      tx.pure.u64(BigInt(params.milestoneId)),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

export interface ApproveMilestoneParams {
  packageId?: string;
  escrowObjectId: string;
  reputationRecordId?: string;
  milestoneId: number;
  gonkaVerifyRequestId?: string;
}

/**
 * Builds a PTB to call `trusthire::escrow::approve_milestone<0x2::sui::SUI>`
 */
export function buildApproveMilestoneTx(params: ApproveMilestoneParams): Transaction {
  const packageId = params.packageId || TESTNET_PACKAGE_ID;
  if (!packageId) {
    throw new Error("Cannot build approve_milestone transaction: NEXT_PUBLIC_TESTNET_PACKAGE_ID is not configured.");
  }

  const tx = new Transaction();

  // If a reputation record is not provided, fall back to a placeholder object or escrow object
  const repRecord = params.reputationRecordId || params.escrowObjectId;

  tx.moveCall({
    target: `${packageId}::escrow::approve_milestone`,
    typeArguments: [SUI_COIN_TYPE],
    arguments: [
      tx.object(params.escrowObjectId),
      tx.object(repRecord),
      tx.pure.u64(BigInt(params.milestoneId)),
      tx.pure.string(params.gonkaVerifyRequestId || ""),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}
