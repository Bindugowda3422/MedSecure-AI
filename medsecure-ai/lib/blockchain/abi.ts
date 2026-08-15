// Minimal ABI for MedicineRegistry — kept in sync with
// blockchain/contracts/MedicineRegistry.sol. If you redeploy after changing
// the contract, regenerate this from blockchain/artifacts/... or copy from
// lib/blockchain/deployed.<network>.json.
export const MEDICINE_REGISTRY_ABI = [
  "function registerMedicine(string medicineId, string batchId, bytes32 medicineHash) external",
  "function getMedicineRecord(string medicineId) external view returns (string batchId, bytes32 medicineHash, uint256 timestamp, address registeredBy, bool exists)",
  "function verifyHash(string medicineId, bytes32 candidateHash) external view returns (bool matched, bool found)",
  "function verifyAndLog(string medicineId, bytes32 candidateHash) external returns (bool matched, bool found)",
  "function setAuthorized(address account, bool authorized) external",
  "function isAuthorized(address account) external view returns (bool)",
  "function owner() external view returns (address)",
  "event MedicineRegistered(string indexed medicineIdIndexed, string medicineId, string batchId, bytes32 medicineHash, uint256 timestamp, address registeredBy)",
  "event MedicineVerified(string indexed medicineIdIndexed, string medicineId, bool matched, uint256 timestamp)",
] as const;
