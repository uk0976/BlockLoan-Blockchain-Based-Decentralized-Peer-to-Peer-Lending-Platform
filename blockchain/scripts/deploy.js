const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting BlockLoan deployment...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const BlockLoan = await hre.ethers.getContractFactory("BlockLoan");
  const blockLoan = await BlockLoan.deploy();
  await blockLoan.waitForDeployment();

  const contractAddress = await blockLoan.getAddress();
  console.log("BlockLoan deployed successfully to:", contractAddress);

  // Prepare deployment export data for frontend and backend
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    deployedAt: new Date().toISOString(),
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "localhost.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment information saved to blockchain/deployments/localhost.json");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
