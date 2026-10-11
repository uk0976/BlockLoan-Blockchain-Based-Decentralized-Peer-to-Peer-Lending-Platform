const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=================================================");
  console.log("Starting BlockLoan Deployment (Phase 2)...");
  console.log("=================================================");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer Address:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance:", hre.ethers.formatEther(balance), "ETH");

  const BlockLoan = await hre.ethers.getContractFactory("BlockLoan");
  const blockLoan = await BlockLoan.deploy();
  await blockLoan.waitForDeployment();

  const contractAddress = await blockLoan.getAddress();
  console.log("BlockLoan Contract Deployed to:", contractAddress);

  // Read compiled artifact for ABI
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "BlockLoan.sol",
    "BlockLoan.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const deploymentData = {
    contractAddress: contractAddress,
    deployer: deployer.address,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };

  // 1. Export to blockchain/deployments/
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  const deploymentFile = path.join(deploymentsDir, "localhost.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
  console.log("Saved deployment artifact to:", deploymentFile);

  // 2. Export directly to frontend/src/contracts/
  const frontendContractsDir = path.join(
    __dirname,
    "..",
    "..",
    "frontend",
    "src",
    "contracts"
  );
  if (fs.existsSync(frontendContractsDir)) {
    const frontendArtifactFile = path.join(frontendContractsDir, "BlockLoan.json");
    fs.writeFileSync(frontendArtifactFile, JSON.stringify(deploymentData, null, 2));
    console.log("Synced ABI & address to frontend at:", frontendArtifactFile);

    // Update contractConfig.ts
    const configContent = `// Auto-generated from Hardhat deployment
export const BLOCKLOAN_CONTRACT_ADDRESS = "${contractAddress}";
export const BLOCKLOAN_CHAIN_ID = ${deploymentData.chainId};
export const BLOCKLOAN_ABI = ${JSON.stringify(artifact.abi, null, 2)};
`;
    fs.writeFileSync(path.join(frontendContractsDir, "contractConfig.ts"), configContent);
    console.log("Updated frontend/src/contracts/contractConfig.ts with deployed address & ABI.");
  }

  console.log("=================================================");
  console.log("Deployment and Artifact Sync Complete!");
  console.log("=================================================");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
