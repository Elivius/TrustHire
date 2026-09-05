import { NextRequest, NextResponse } from "next/server";
import { EnokiClient } from "@mysten/enoki";

// Initialize EnokiClient using private API key
const enokiApiKey = process.env.ENOKI_API_KEY || "";

let enokiClient: EnokiClient | null = null;
if (enokiApiKey) {
  try {
    enokiClient = new EnokiClient({
      apiKey: enokiApiKey,
    });
  } catch (err) {
    console.warn("Failed to initialize EnokiClient:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!enokiClient) {
      return NextResponse.json(
        { error: "ENOKI_API_KEY is not configured on the server." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { action, sender, network = "testnet", transactionKindBytes, digest, signature } = body;

    // 1. Request gas sponsorship from Enoki
    if (action === "create") {
      if (!sender || !transactionKindBytes) {
        return NextResponse.json(
          { error: "Missing required fields: sender, transactionKindBytes" },
          { status: 400 }
        );
      }

      const sponsored = await enokiClient.createSponsoredTransaction({
        network: (network as "testnet" | "mainnet") || "testnet",
        sender,
        transactionKindBytes,
      });

      return NextResponse.json({
        bytes: sponsored.bytes,
        digest: sponsored.digest,
      });
    }

    // 2. Submit user's signed transaction to Enoki to broadcast & pay gas
    if (action === "execute") {
      if (!digest || !signature) {
        return NextResponse.json(
          { error: "Missing required fields: digest, signature" },
          { status: 400 }
        );
      }

      const result = await enokiClient.executeSponsoredTransaction({
        digest,
        signature,
      });

      return NextResponse.json({
        digest: result.digest,
      });
    }

    return NextResponse.json({ error: "Invalid action. Expected 'create' or 'execute'." }, { status: 400 });
  } catch (error: any) {
    console.error("Enoki sponsor route error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process sponsored transaction with Enoki." },
      { status: 500 }
    );
  }
}
