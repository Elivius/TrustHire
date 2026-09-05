import { Transaction } from "@mysten/sui/transactions";

/**
 * Sui Escrow smart contract integration constants and PTB builders.
 */

export const SUI_CLOCK_OBJECT_ID = "0x6";
export const SUI_COIN_TYPE = "0x2::sui::SUI";

// Testnet package ID from environment
export const TESTNET_PACKAGE_ID = process.env.NEXT_PUBLIC_TESTNET_PACKAGE_ID || "";

// 1 SUI = 1,000,000,000 MIST (10^9)
export const SUI_BASE_MIST = 1_000_000_000n;

/**
 * Convert SUI budget amount to MIST (base SUI units).
 * 1 SUI = 1,000,000,000 MIST (10^9).
 * For small test amounts (<= 5 SUI), 1 unit = 1 full SUI (1,000,000,000 MIST) so wallet balances visibly increase.
 * For larger budgets (e.g. 10 - 5,000 SUI), scales to sensible testnet faucet fractions (0.1 - 0.5 SUI)
 * so clients can fund them from standard testnet faucet balances.
 */
export function suiToMist(amount: number): bigint {
  const cleanVal = Number(amount) || 0;
  if (cleanVal <= 0) return 100_000_000n; // Default 0.1 SUI

  // Small test values (e.g. 1, 2, 3 SUI): 1 SUI = 1.0 SUI (1,000,000,000 MIST)
  if (cleanVal <= 5) {
    return BigInt(Math.round(cleanVal * 1_000_000_000));
  }

  // Medium test values (e.g. 10 - 100 SUI): 0.01 SUI per unit (e.g. 10 = 0.1 SUI, 50 = 0.5 SUI)
  if (cleanVal <= 100) {
    return BigInt(Math.round(cleanVal * 10_000_000));
  }

  // Large budgets (500 - 5,000 SUI): scaled to 0.2 - 0.5 SUI per milestone
  return BigInt(Math.max(200_000_000, Math.min(1_000_000_000, Math.round(cleanVal * 200_000))));
}

export const usdToMist = suiToMist;

/**
 * Explorer link helpers for Suiscan
 */
export function getSuiscanTxUrl(digest: string, network = "testnet"): string {
  return `https://suiscan.xyz/${network}/tx/${digest}`;
}

export function getSuiscanObjectUrl(objectId: string, network = "testnet"): string {
  return `https://suiscan.xyz/${network}/object/${objectId}`;
}

export function isRealSuiDigest(digest?: string): boolean {
  if (!digest) return false;
  if (digest.includes("...")) return false;
  return digest.length >= 40 && !digest.startsWith("0x");
}

export function isRealSuiObjectId(id?: string): boolean {
  if (!id) return false;
  if (id.includes("...")) return false;
  return id.startsWith("0x") && id.length >= 64;
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
    amountSui: number;
    amount?: number;
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
    const mist = suiToMist(m.amountSui ?? m.amount ?? 0);
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
 * Safely resolves the 0-based on-chain milestone_id for a given milestone.
 * On Sui, escrow milestones are indexed 0, 1, 2, ... corresponding to Milestone 1, Milestone 2, etc.
 */
export function getMilestoneOnChainId(
  targetMs: { id: string; title?: string; projectId: string },
  allMilestones: { id: string; title?: string; projectId: string }[]
): number {
  const projectMilestones = allMilestones.filter((m) => m.projectId === targetMs.projectId);
  const idx = projectMilestones.findIndex((m) => m.id === targetMs.id);
  return Math.max(0, idx);
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

export const DEFAULT_TESTNET_REGISTRY_ID =
  process.env.NEXT_PUBLIC_TESTNET_REGISTRY_ID ||
  "0x4a658eb28d57d0360de90e05236e2b0c5e088aff9e841f076775d3c350cea50d";

export const DEFAULT_FREELANCER_REPUTATION_RECORD_ID =
  "0x98e60a5c739552b7cc1a7b8aa26c5cb18d4602823ec58e25475f4df6e42ff91c";

export async function resolveFreelancerReputationRecordId(
  client: any,
  freelancerAddress: string
): Promise<string | null> {
  try {
    const registryId = DEFAULT_TESTNET_REGISTRY_ID;
    if (client && typeof client.listDynamicFields === "function") {
      const dynFields = await client.listDynamicFields({ parentId: registryId });
      for (const field of dynFields?.dynamicFields || []) {
        const fieldObj = await client.getObject({
          objectId: field.fieldId,
          include: { json: true }
        });
        const content = fieldObj?.object?.json || fieldObj?.object?.content;
        const storedAddr = content?.name?.pos0 || content?.name?.value;
        if (
          storedAddr &&
          storedAddr.toLowerCase() === freelancerAddress.toLowerCase() &&
          content?.value
        ) {
          return content.value;
        }
      }
    }
  } catch (err) {
    console.warn("resolveFreelancerReputationRecordId warning:", err);
  }
  return null;
}

export interface ApproveMilestoneParams {
  packageId?: string;
  escrowObjectId: string;
  reputationRecordId?: string | null;
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

  // Use resolved reputation record ID, or fallback to known shared reputation record
  const repRecord = params.reputationRecordId || DEFAULT_FREELANCER_REPUTATION_RECORD_ID;

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

export interface OnChainReputationData {
  recordId: string;
  freelancer: string;
  completedProjects: number;
  totalEarnedMist: number;
  totalEarnedSui: number;
  onTimeCount: number;
  onTimeDeliveryPct: number;
  avgRating: number;
  ratingCount: number;
  gonkaTrustScore: number;
  gonkaTrustRequestId: string;
  lastUpdatedMs: number;
  explorerUrl: string;
}

/**
 * Builds a PTB to call `trusthire::reputation::create_record`
 */
export function buildCreateReputationRecordTx(params: {
  packageId?: string;
  registryId?: string;
  freelancerAddress: string;
}): Transaction {
  const packageId = params.packageId || TESTNET_PACKAGE_ID;
  if (!packageId) {
    throw new Error("Cannot build create_record transaction: NEXT_PUBLIC_TESTNET_PACKAGE_ID is not configured.");
  }
  const registryId = params.registryId || DEFAULT_TESTNET_REGISTRY_ID;
  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::reputation::create_record`,
    arguments: [
      tx.object(registryId),
      tx.pure.address(params.freelancerAddress),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

/**
 * Queries and parses an on-chain ReputationRecord from Sui Testnet
 */
export async function fetchOnChainReputationRecord(
  client: any,
  freelancerAddress: string
): Promise<OnChainReputationData | null> {
  if (!freelancerAddress) return null;
  try {
    const recordId = await resolveFreelancerReputationRecordId(client, freelancerAddress);
    if (!recordId) return null;

    let objData: any = null;
    if (client && typeof client.getObject === "function") {
      try {
        const resp = await client.getObject({
          objectId: recordId,
          include: { json: true }
        });
        objData = resp?.object?.json || resp?.object?.content;
      } catch (clientErr) {
        console.warn("Could not query getObject on client:", clientErr);
      }
    }

    if (!objData) return null;

    if (objData.freelancer && objData.freelancer.toLowerCase() !== freelancerAddress.toLowerCase()) {
      return null;
    }

    const completedProjects = Number(objData.completed_projects) || 0;
    const totalEarnedMist = Number(objData.total_earned) || 0;
    const totalEarnedSui = totalEarnedMist / 1_000_000_000;
    const onTimeCount = Number(objData.on_time_count) || 0;
    const onTimeDeliveryPct = completedProjects > 0 ? Math.round((onTimeCount / completedProjects) * 100) : 100;
    const avgRatingX10 = Number(objData.avg_rating_x10) || 0;
    const avgRating = avgRatingX10 > 0 ? Number((avgRatingX10 / 10).toFixed(1)) : 0;
    const ratingCount = Number(objData.rating_count) || 0;
    const gonkaTrustScore = Number(objData.gonka_trust_score) || 0;
    const gonkaTrustRequestId = objData.gonka_trust_request_id || "";
    const lastUpdatedMs = Number(objData.last_updated_ms) || 0;

    return {
      recordId,
      freelancer: objData.freelancer || freelancerAddress,
      completedProjects,
      totalEarnedMist,
      totalEarnedSui,
      onTimeCount,
      onTimeDeliveryPct,
      avgRating,
      ratingCount,
      gonkaTrustScore,
      gonkaTrustRequestId,
      lastUpdatedMs,
      explorerUrl: getSuiscanObjectUrl(recordId),
    };
  } catch (err) {
    console.warn("fetchOnChainReputationRecord warning:", err);
    return null;
  }
}
