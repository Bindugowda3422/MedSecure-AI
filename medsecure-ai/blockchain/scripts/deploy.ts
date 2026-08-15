import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deploys MedicineRegistry and writes the deployed address + ABI to
 * lib/blockchain/deployed.<network>.json so the Next.js app can pick it up.
 *
 * Usage:
 *   npm run chain:deploy:local     (requires `npm run chain:node` running)
 *   npm run chain:deploy:sepolia   (requires SEPOLIA_RPC_URL + DEPLOYER_PRIVATE_KEY in .env.local)
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying MedicineRegistry with account: ${deployer.address}`);
  console.log(`Network: ${network.name}`);

  const Factory = await ethers.getContractFactory("MedicineRegistry");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`MedicineRegistry deployed to: ${address}`);

  const artifact = await import(
    path.resolve(__dirname, "..", "artifacts", "blockchain", "contracts", "MedicineRegistry.sol", "MedicineRegistry.json")
  );

  const outDir = path.resolve(__dirname, "..", "..", "lib", "blockchain");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `deployed.${network.name}.json`);
  fs.writeFileSync(
    outFile,
    JSON.stringify(
      {
        network: network.name,
        address,
        deployedBy: deployer.address,
        abi: artifact.abi,
      },
      null,
      2
    )
  );

  console.log(`Wrote deployment info to ${outFile}`);
  console.log(`\nSet this in your .env.local:\nCONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
