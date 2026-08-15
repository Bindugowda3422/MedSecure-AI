import { expect } from "chai";
import { ethers } from "hardhat";
import { createHash } from "crypto";

function fakeHash(input: string): string {
  return "0x" + createHash("sha256").update(input).digest("hex");
}

describe("MedicineRegistry", () => {
  it("registers a medicine and retrieves it", async () => {
    const Factory = await ethers.getContractFactory("MedicineRegistry");
    const contract = await Factory.deploy();

    const hash = fakeHash("MED-IND-2026-000001|BATCH001|Demo Pharma");
    await contract.registerMedicine("MED-IND-2026-000001", "BATCH001", hash);

    const record = await contract.getMedicineRecord("MED-IND-2026-000001");
    expect(record.exists).to.equal(true);
    expect(record.medicineHash).to.equal(hash);
    expect(record.batchId).to.equal("BATCH001");
  });

  it("rejects duplicate registration of the same medicineId", async () => {
    const Factory = await ethers.getContractFactory("MedicineRegistry");
    const contract = await Factory.deploy();

    const hash = fakeHash("dup-test");
    await contract.registerMedicine("MED-DUP-001", "B1", hash);

    await expect(
      contract.registerMedicine("MED-DUP-001", "B1", hash)
    ).to.be.revertedWith("MedicineRegistry: already registered");
  });

  it("verifyHash returns matched=true for the correct hash and false for a tampered one", async () => {
    const Factory = await ethers.getContractFactory("MedicineRegistry");
    const contract = await Factory.deploy();

    const originalHash = fakeHash("original-record");
    const tamperedHash = fakeHash("tampered-record");

    await contract.registerMedicine("MED-TAMPER-001", "B1", originalHash);

    const [matchOriginal] = await contract.verifyHash("MED-TAMPER-001", originalHash);
    expect(matchOriginal).to.equal(true);

    const [matchTampered] = await contract.verifyHash("MED-TAMPER-001", tamperedHash);
    expect(matchTampered).to.equal(false);
  });

  it("returns found=false for an unknown medicineId", async () => {
    const Factory = await ethers.getContractFactory("MedicineRegistry");
    const contract = await Factory.deploy();

    const [, found] = await contract.verifyHash("MED-DOES-NOT-EXIST", fakeHash("x"));
    expect(found).to.equal(false);
  });

  it("only authorized accounts can register", async () => {
    const Factory = await ethers.getContractFactory("MedicineRegistry");
    const contract = await Factory.deploy();
    const [, other] = await ethers.getSigners();

    await expect(
      contract.connect(other).registerMedicine("MED-X", "B1", fakeHash("x"))
    ).to.be.revertedWith("MedicineRegistry: caller is not authorized");
  });
});
