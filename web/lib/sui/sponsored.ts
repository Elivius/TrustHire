import { Transaction } from "@mysten/sui/transactions";
import { toBase64 } from "@mysten/sui/utils";

export interface ExecuteSponsoredOptions {
  transaction: Transaction;
  senderAddress: string;
  suiClient: any;
  dAppKit: any;
  network?: "testnet" | "mainnet";
  fallbackToStandard?: boolean;
}

export interface SponsoredExecutionResult {
  digest: string;
  sponsored: boolean;
}

/**
 * Executes a transaction sponsored by Enoki Gas Station.
 * 1. Builds kind-only bytes (no gas data, no gas coins selected).
 * 2. Asks the server / Enoki to attach gas and sign as gas owner.
 * 3. Asks user wallet (or zkLogin session) via dAppKit to sign the sponsored transaction.
 * 4. Submits the dual-signed transaction to Enoki to broadcast and pay gas.
 * 5. Falls back to standard signAndExecuteTransaction if sponsorship fails or is not yet configured.
 */
export async function executeWithEnokiSponsorship({
  transaction,
  senderAddress,
  suiClient,
  dAppKit,
  network = "testnet",
  fallbackToStandard = true,
}: ExecuteSponsoredOptions): Promise<SponsoredExecutionResult> {
  try {
    if (!senderAddress) {
      throw new Error("Cannot execute sponsored transaction: senderAddress is required.");
    }

    // 1. Build the transaction kind-only (gasless)
    const kindBytes = await transaction.build({
      client: suiClient,
      onlyTransactionKind: true,
    });
    const transactionKindBytes = toBase64(kindBytes);

    // 2. Request Enoki gas sponsorship
    const createRes = await fetch("/api/enoki/sponsor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        sender: senderAddress,
        network,
        transactionKindBytes,
      }),
    });

    if (!createRes.ok) {
      const errorData = await createRes.json().catch(() => ({}));
      throw new Error(errorData.error || `Enoki sponsorship request failed (HTTP ${createRes.status})`);
    }

    const { bytes: sponsoredBytes, digest } = await createRes.json();
    if (!sponsoredBytes || !digest) {
      throw new Error("Invalid response from Enoki sponsor API: missing bytes or digest.");
    }

    // 3. User signs the sponsored transaction
    const sponsoredTx = Transaction.from(sponsoredBytes);
    const signResult = await dAppKit.signTransaction({
      transaction: sponsoredTx,
    });

    const signature = signResult.signature;
    if (!signature) {
      throw new Error("Failed to obtain user signature for sponsored transaction.");
    }

    // 4. Submit to Enoki to execute and pay gas
    const execRes = await fetch("/api/enoki/sponsor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "execute",
        digest,
        signature,
      }),
    });

    if (!execRes.ok) {
      const errorData = await execRes.json().catch(() => ({}));
      throw new Error(errorData.error || `Enoki execute request failed (HTTP ${execRes.status})`);
    }

    const execResult = await execRes.json();
    const finalDigest = execResult.digest || digest;

    // 5. Wait for indexer confirmation
    if (suiClient && typeof suiClient.waitForTransaction === "function") {
      try {
        await suiClient.waitForTransaction({ digest: finalDigest });
      } catch (waitErr) {
        console.warn("waitForTransaction warning:", waitErr);
      }
    }

    return { digest: finalDigest, sponsored: true };
  } catch (error: any) {
    console.warn("Enoki sponsorship error, checking fallback:", error?.message);

    if (fallbackToStandard && dAppKit?.signAndExecuteTransaction) {
      console.log("Falling back to standard user-paid transaction via dAppKit...");
      const result = await dAppKit.signAndExecuteTransaction({ transaction });

      if (result.$kind === "FailedTransaction") {
        throw new Error(result.FailedTransaction.status.error?.message ?? "Transaction failed on Sui");
      }

      const digest = result.Transaction?.digest || result.digest || "";
      return { digest, sponsored: false };
    }

    throw error;
  }
}
