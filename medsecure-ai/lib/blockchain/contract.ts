import "server-only";
import { ethers } from "ethers";
import { MEDICINE_REGISTRY_ABI } from "./abi";

/**
 * Server-only blockchain client. Never import this from a Client Component —
 * the "server-only" import above will throw a build error if you try.
 *
 * Reads BLOCKCHAIN_RPC_URL, BLOCKCHAIN_PRIVATE_KEY and CONTRACT_ADDRESS from
 * environment variables. None of these are NEXT_PUBLIC_ and therefore never
 * reach the browser bundle.
 */

let cachedProvider: ethers.JsonRpcProvider | null = null;
let cachedWallet: ethers.Wallet | null = null;
let cachedContract: ethers.Contract | null = null;

function getProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
  if (!rpcUrl) {
    throw new Error("BLOCKCHAIN_RPC_URL is not configured");
  }
  if (!cachedProvider) {
    cachedProvider = new ethers.JsonRpcProvider(rpcUrl);
  }
  return cachedProvider;
}

function getWallet(): ethers.Wallet {
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("BLOCKCHAIN_PRIVATE_KEY is not configured");
  }
  if (!cachedWallet) {
    cachedWallet = new ethers.Wallet(privateKey, getProvider());
  }
  return cachedWallet;
}

export function getContract(): ethers.Contract {
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) {
    throw new Error("CONTRACT_ADDRESS is not configured");
  }
  if (!cachedContract) {
    cachedContract = new ethers.Contract(address, MEDICINE_REGISTRY_ABI, getWallet());
  }
  return cachedContract;
}

export function isBlockchainConfigured(): boolean {
  return Boolean(
    process.env.BLOCKCHAIN_RPC_URL &&
      process.env.BLOCKCHAIN_PRIVATE_KEY &&
      process.env.CONTRACT_ADDRESS
  );
}

export interface RegisterResult {
  txHash: string;
  blockNumber: number | null;
}

/** Registers a medicine hash on-chain. Throws if already registered
 *  (contract reverts) or if blockchain is unreachable/misconfigured. */
export async function registerMedicineOnChain(
  medicineId: string,
  batchId: string,
  medicineHashHex: string
): Promise<RegisterResult> {
  const contract = getContract();
  const tx = await contract.registerMedicine(medicineId, batchId, medicineHashHex);
  const receipt = await tx.wait();
  return {
    txHash: tx.hash,
    blockNumber: receipt?.blockNumber ?? null,
  };
}

export interface OnChainRecord {
  found: boolean;
  batchId: string | null;
  medicineHash: string | null;
  timestamp: number | null;
  registeredBy: string | null;
}

/** Reads the on-chain record for a medicineId (read-only, no gas cost from caller). */
export async function getOnChainRecord(medicineId: string): Promise<OnChainRecord> {
  const contract = getContract();
  const result = await contract.getMedicineRecord(medicineId);
  const [batchId, medicineHash, timestamp, registeredBy, exists] = result;
  if (!exists) {
    return { found: false, batchId: null, medicineHash: null, timestamp: null, registeredBy: null };
  }
  return {
    found: true,
    batchId,
    medicineHash,
    timestamp: Number(timestamp),
    registeredBy,
  };
}
