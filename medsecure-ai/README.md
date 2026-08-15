# MedSecure AI

**Scan. Identify. Verify. Stay Safe.**

## Problem

In India, medicine strips are frequently cut apart so people can buy just a
few loose tablets. Once separated from the strip, there's often no reliable
way to identify what the tablet is, its dosage, expiry, or whether the
information on it can be trusted.

## Solution

MedSecure AI lets a pharmacy/manufacturer register a medicine batch once. The
registration:

1. Creates a database record and a unique public **Medicine ID**
   (e.g. `MED-IND-2026-000001`).
2. Generates a **QR code** encoding only a verification URL — never full
   medicine data.
3. Computes a **SHA-256 hash** of the canonical medicine record.
4. Writes that hash to a **smart contract** on-chain (`MedicineRegistry.sol`).

Anyone can then scan the QR (or type the Medicine ID) to:

1. Look the record up in the database.
2. Recompute its hash **right now**.
3. Compare that against the hash stored **on-chain**.
4. See **VERIFIED**, **VERIFICATION FAILED** (record was altered since
   registration), or **UNKNOWN** (never registered).
5. Ask an AI assistant questions about the verified medicine, answered only
   from that medicine's verified record.

> **Important:** this proves that *the registered medicine/batch record* is
> unchanged since blockchain registration. It cannot physically prove that
> one specific loose tablet in someone's hand is genuine — there is no
> physical anti-counterfeit link between a pill and the record (that would
> require tamper-evident packaging/serialization infrastructure, which is
> out of scope for this MVP). It uses demonstration medicine data and does
> not imply government, pharma, or clinical certification.

## Architecture

```
Admin registers medicine
  → Supabase Postgres (medicines table)
  → SHA-256 hash of canonical fields
  → MedicineRegistry.sol on Sepolia/local Hardhat (registerMedicine)
  → tx hash stored back in Supabase

User scans QR → /verify/[medicineId]
  → fetch medicine from Supabase
  → recompute hash from CURRENT record
  → read original hash from chain (getMedicineRecord)
  → compare → VERIFIED / FAILED / UNKNOWN
  → log attempt in verification_logs
  → medicine info + "Ask AI" button
```

## Tech Stack

- **Frontend/Backend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database/Auth:** Supabase (Postgres + Auth + RLS)
- **Blockchain:** Solidity, Hardhat, ethers.js v6, Sepolia testnet (or local Hardhat node)
- **QR:** `qrcode` (generation), `html5-qrcode` (camera scanning)
- **AI:** Gemini API (`gemini-2.0-flash`) — swappable in `lib/ai/assistant.ts`
- **Deployment:** Vercel-compatible

## Installation

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where it's used | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Public anon key (RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Used in trusted route handlers to bypass RLS for admin writes/reads. **Never expose to client.** |
| `BLOCKCHAIN_RPC_URL` | server only | `http://127.0.0.1:8545` for local Hardhat, or your Sepolia RPC |
| `BLOCKCHAIN_PRIVATE_KEY` | server only | Signer used by the app to call `registerMedicine`. **Never commit.** |
| `CONTRACT_ADDRESS` | server only | Deployed `MedicineRegistry` address |
| `SEPOLIA_RPC_URL` / `DEPLOYER_PRIVATE_KEY` | Hardhat only | Only needed to deploy to Sepolia via `hardhat.config.ts` |
| `AI_API_KEY` | server only | Gemini API key |
| `AI_PROVIDER` | server only | `gemini` (default) |
| `NEXT_PUBLIC_APP_URL` | client + server | Used to build the QR verification URL, e.g. `http://localhost:3000` |

## Supabase Setup

1. Create a project at supabase.com.
2. Run the migration in `supabase/migrations/0001_init.sql` via the SQL editor
   (or `supabase db push` with the Supabase CLI). It creates `profiles`,
   `medicines`, `verification_logs`, RLS policies, and a trigger that
   auto-creates a `profiles` row (role `user`) on signup.
3. Create your first admin: sign up a user (via Supabase Auth or the app's
   `/login` page won't sign up — use the Supabase dashboard's "Add user" or
   the `auth.signUp` API), then in the SQL editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

## Blockchain Setup

### Local development (no testnet needed)

```bash
npm run chain:compile
npm run chain:node          # keep this running — local Hardhat chain on :8545
# in another terminal:
npm run chain:deploy:local
```

Deployment writes the contract address to
`lib/blockchain/deployed.localhost.json` and prints the value to put in
`CONTRACT_ADDRESS`. For `BLOCKCHAIN_PRIVATE_KEY`, use one of the private keys
Hardhat prints when `chain:node` starts (test accounts, funded with test ETH
on the local chain only).

### Sepolia testnet

1. Get a Sepolia RPC URL (Alchemy/Infura/etc.) and a funded Sepolia private key.
2. Set `SEPOLIA_RPC_URL` and `DEPLOYER_PRIVATE_KEY` in `.env.local`.
3. `npm run chain:compile && npm run chain:deploy:sepolia`
4. Copy the printed address into `CONTRACT_ADDRESS`, and set
   `BLOCKCHAIN_RPC_URL=<your Sepolia RPC>` and `BLOCKCHAIN_PRIVATE_KEY` (can
   be the same deployer key, or a separate authorized signer — see
   `setAuthorized` in the contract).

## Smart Contract

`blockchain/contracts/MedicineRegistry.sol` stores, per `medicineId`: the
batch ID, a `bytes32` hash of the medicine record, a timestamp, and the
registering address. It:

- Rejects duplicate registration of the same `medicineId`.
- Restricts `registerMedicine` to the contract owner or addresses explicitly
  authorized via `setAuthorized`.
- Exposes `getMedicineRecord` (read) and `verifyHash`/`verifyAndLog` (compare
  a freshly computed hash against the stored one).
- Emits `MedicineRegistered` and `MedicineVerified` events.

Tests: `blockchain/test/MedicineRegistry.test.ts` — run with `npm run chain:test`.

## Running Locally

```bash
npm install
npm run chain:compile
npm run chain:node            # terminal 1
npm run chain:deploy:local    # terminal 2 — copy address into .env.local
npm run dev                   # terminal 2 — app on http://localhost:3000
```

## Testing

```bash
npm test          # hashing unit tests (vitest)
npm run chain:test # smart contract tests (hardhat/chai)
```

What's covered:

- **Hashing:** same input → same hash; changed input → different hash; hash format.
- **Blockchain:** registration succeeds; duplicate registration reverts; `verifyHash` correctly matches/rejects; unauthorized callers rejected; unknown IDs return `found=false`.
- **Verification flow:** exercised end-to-end via the demo scenario below (valid → VERIFIED, unknown ID → UNKNOWN, tampered record → VERIFICATION FAILED).
- **AI:** the assistant route always loads context server-side from the verified DB record — it never trusts client-supplied medicine data — and the system prompt forbids diagnosis/prescription/dosage changes.

## Demo Walkthrough

1. Log in at `/login` as an admin (see Supabase Setup above).
2. Go to `/admin/medicines` → **Seed Demo Data** (loads Paracetamol,
   Cetirizine, Omeprazole, Azithromycin through the real hash + on-chain
   pipeline), or `/admin/register` to add your own, e.g.:
   - Name: `Paracetamol 500 mg`, Batch: `BATCH001`, Manufacturer: `Demo Pharma`
3. After registration, download/print the generated **QR code**.
4. Visit `/scan` (camera) or `/verify/[medicineId]` (direct/manual) to verify
   → should show **✓ VERIFIED MEDICINE** with medicine info, blockchain
   status, and transaction hash.
5. Click **Ask MedSecure AI** and ask e.g. "What is this medicine used for?"
6. **Tampering demo:** on `/admin/medicines`, click **Simulate Tamper** next
   to a demo medicine (this only mutates the database `composition` field —
   it never touches the blockchain, and it refuses to run on non-demo
   records). Verify the same medicine again → **⚠ VERIFICATION FAILED**.
7. **Unknown demo:** visit `/verify/MED-DOES-NOT-EXIST` → **⚠ UNKNOWN MEDICINE**.
8. View `/admin` for aggregate stats and `/admin/verifications` for the full log.

## Security Notes

- `BLOCKCHAIN_PRIVATE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `AI_API_KEY` are
  read only in files marked `import "server-only"` or Route Handlers — never
  in Client Components, and never prefixed `NEXT_PUBLIC_`.
- Supabase RLS: `medicines` are publicly readable (verification is a public
  flow) but only admin profiles can insert/update; service-role writes in
  API routes are gated by an explicit `requireAdmin()` check first.
- `.env.local` is gitignored; commit only `.env.example`.
- The tamper-demo endpoint checks `is_demo = true` server-side before
  mutating anything, so it cannot be pointed at a real record.

## Deployment (Vercel)

1. Push to a git repo, import into Vercel.
2. Add all variables from `.env.example` in Vercel's Environment Variables
   settings (values from your Supabase project + your deployed contract).
3. Blockchain and Supabase migrations are external to the Vercel build —
   deploy the contract and run migrations first, then deploy the app.

## What's intentionally out of scope (see prompt's "Do not overengineer")

Real pharma/government integrations, payments, supply-chain tracking, native
mobile apps, large-scale infra. This is a demonstrable MVP.
