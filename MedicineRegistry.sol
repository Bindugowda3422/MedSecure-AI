// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MedicineRegistry
/// @notice Stores tamper-evident hashes of registered medicine/batch records
///         for MedSecure AI. This contract does NOT store personal or full
///         medicine data on-chain — only the identifiers and a hash, so the
///         chain can prove "this exact record was registered at time T"
///         without putting PII or medical detail on a public ledger.
contract MedicineRegistry {
    struct MedicineRecord {
        string medicineId;
        string batchId;
        bytes32 medicineHash;
        uint256 timestamp;
        address registeredBy;
        bool exists;
    }

    address public owner;

    /// medicineId => record
    mapping(string => MedicineRecord) private records;

    /// addresses allowed to register medicines (owner + delegated admins)
    mapping(address => bool) public isAuthorized;

    event MedicineRegistered(
        string indexed medicineIdIndexed,
        string medicineId,
        string batchId,
        bytes32 medicineHash,
        uint256 timestamp,
        address registeredBy
    );

    event MedicineVerified(
        string indexed medicineIdIndexed,
        string medicineId,
        bool matched,
        uint256 timestamp
    );

    event AuthorizationChanged(address indexed account, bool authorized);

    modifier onlyOwner() {
        require(msg.sender == owner, "MedicineRegistry: caller is not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || isAuthorized[msg.sender],
            "MedicineRegistry: caller is not authorized"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        isAuthorized[msg.sender] = true;
        emit AuthorizationChanged(msg.sender, true);
    }

    /// @notice Grant or revoke registration rights to an address.
    function setAuthorized(address account, bool authorized) external onlyOwner {
        isAuthorized[account] = authorized;
        emit AuthorizationChanged(account, authorized);
    }

    /// @notice Register a new medicine/batch record. Reverts if the
    ///         medicineId has already been registered — prevents
    ///         unauthorized duplicate/overwrite registration.
    function registerMedicine(
        string calldata medicineId,
        string calldata batchId,
        bytes32 medicineHash
    ) external onlyAuthorized {
        require(bytes(medicineId).length > 0, "MedicineRegistry: empty medicineId");
        require(!records[medicineId].exists, "MedicineRegistry: already registered");

        records[medicineId] = MedicineRecord({
            medicineId: medicineId,
            batchId: batchId,
            medicineHash: medicineHash,
            timestamp: block.timestamp,
            registeredBy: msg.sender,
            exists: true
        });

        emit MedicineRegistered(
            medicineId,
            medicineId,
            batchId,
            medicineHash,
            block.timestamp,
            msg.sender
        );
    }

    /// @notice Fetch the on-chain record for a medicineId.
    function getMedicineRecord(string calldata medicineId)
        external
        view
        returns (
            string memory batchId,
            bytes32 medicineHash,
            uint256 timestamp,
            address registeredBy,
            bool exists
        )
    {
        MedicineRecord storage r = records[medicineId];
        return (r.batchId, r.medicineHash, r.timestamp, r.registeredBy, r.exists);
    }

    /// @notice Convenience view: compare a freshly computed hash against the
    ///         on-chain hash for medicineId. Also emits a MedicineVerified
    ///         event via verifyAndLog if a persistent on-chain audit trail
    ///         of verification attempts is desired (kept separate from the
    ///         view function since views cannot emit events).
    function verifyHash(string calldata medicineId, bytes32 candidateHash)
        external
        view
        returns (bool matched, bool found)
    {
        MedicineRecord storage r = records[medicineId];
        if (!r.exists) {
            return (false, false);
        }
        return (r.medicineHash == candidateHash, true);
    }

    /// @notice Same as verifyHash but persists an on-chain event log of the
    ///         verification attempt. Optional — the app's Postgres
    ///         verification_logs table is the primary audit log; this is
    ///         provided for fully on-chain-auditable deployments.
    function verifyAndLog(string calldata medicineId, bytes32 candidateHash)
        external
        returns (bool matched, bool found)
    {
        MedicineRecord storage r = records[medicineId];
        bool exists_ = r.exists;
        bool matched_ = exists_ && r.medicineHash == candidateHash;
        emit MedicineVerified(medicineId, medicineId, matched_, block.timestamp);
        return (matched_, exists_);
    }
}
