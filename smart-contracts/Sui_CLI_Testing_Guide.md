# TrustHire CLI Testing Guide

If you want to manually test the contract on Testnet without waiting for the frontend, you can do it entirely through the Sui CLI. Here is the step-by-step flow.

> **Note:** Before you start, make sure you have some Testnet SUI for gas. You can get some by running: `sui client faucet`

## 1. Publish the Contract

First, deploy your code to Testnet.

```bash
sui client publish --gas-budget 100000000
```

**Save these IDs from the output:**
- `Package ID`: The ID of your published package.
- `ReputationRegistry`: The shared object ID for the reputation registry (look for the object type `...::reputation::ReputationRegistry`).

*We will refer to these as `<PACKAGE_ID>` and `<REGISTRY_ID>` below.*

---

## 2. Freelancer: Create a Reputation Record

Before a freelancer can be hired, they need a reputation record.

```bash
sui client call \
  --package <PACKAGE_ID> \
  --module reputation \
  --function create_record \
  --args <REGISTRY_ID> @<FREELANCER_ADDRESS> @0x6 \
  --gas-budget 10000000
```
> **Tip:** `@0x6` is the fixed address for the Sui `Clock` object required for timestamps.

**Save this ID:**
- The transaction will create a new shared object of type `...::reputation::ReputationRecord`. Save its object ID. We will call it `<RECORD_ID>`.

---

## 3. Client: Create the Escrow

The client will create the escrow and lock up the funds. 
*Note: In this example, we use `0x2::sui::SUI` as the payment coin for simplicity, so you don't have to mint fake USDC yet.*

First, get a Coin ID from your wallet that has enough balance (e.g., 1 SUI = 1,000,000,000 MIST).
```bash
sui client gas
```
Copy a Coin ID to use in the command below (but for PTB, we can just let it auto-select gas and split it).

Now, run the PTB to create the escrow. We'll do a 2-milestone project (600 MIST and 400 MIST).

```bash
sui client ptb \
  --split-coins gas "[1000]" \
  --assign payment \
  --move-call "<PACKAGE_ID>::escrow::create_escrow<0x2::sui::SUI>" \
    '"proj-uuid-demo"' \
    "@<FREELANCER_ADDRESS>" \
    payment.0 \
    "[0, 1]" \
    '["Design", "Code"]' \
    '["Figma link", "Github repo"]' \
    "[600, 400]" \
    "[0, 0]" \
    '"gonka-req-demo"' \
    "@0x6" \
  --gas-budget 100000000
```

**Save this ID:**
- The transaction will create a new shared object of type `...::escrow::EscrowContract<0x2::sui::SUI>`. Save its ID as `<ESCROW_ID>`.

---

## 4. Freelancer: Submit a Milestone

When the freelancer finishes Phase 1, they mark milestone `0` as submitted.
*(You must run this command using the Freelancer's wallet address).*

```bash
sui client call \
  --package <PACKAGE_ID> \
  --module escrow \
  --function submit_milestone \
  --type-args 0x2::sui::SUI \
  --args <ESCROW_ID> 0 @0x6 \
  --gas-budget 10000000
```

---

## 5. Client: Approve the Milestone

The client reviews the work and approves it. The contract will instantly release 600 MIST to the freelancer.
*(You must run this command using the Client's wallet address).*

```bash
sui client call \
  --package <PACKAGE_ID> \
  --module escrow \
  --function approve_milestone \
  --type-args 0x2::sui::SUI \
  --args <ESCROW_ID> <RECORD_ID> 0 '"gonka-approval-req-001"' @0x6 \
  --gas-budget 10000000
```

> **Tip:** You can repeat Steps 4 and 5 for milestone `1`. Once milestone `1` is approved, the escrow status changes to `Completed`, and the freelancer's `<RECORD_ID>` will automatically update to show `1` completed project!

---

## Useful Commands to check state

To view the exact state of the Escrow or the Reputation Record at any time:

```bash
sui client object <ESCROW_ID>
sui client object <RECORD_ID>
```
