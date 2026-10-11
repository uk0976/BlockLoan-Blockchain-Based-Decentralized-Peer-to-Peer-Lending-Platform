const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=================================================================");
  console.log("        BlockLoan — Local Deployment Verification Audit          ");
  console.log("=================================================================");

  // 1. Verify Network and Node Connectivity
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  console.log(`Node Connected : http://127.0.0.1:8545`);
  console.log(`Network Name   : ${hre.network.name}`);
  console.log(`Chain ID       : ${chainId} ${chainId === 31337 ? "✓ (Expected Hardhat Chain)" : "⚠ (Unexpected Chain)"}`);

  if (chainId !== 31337 && hre.network.name === "localhost") {
    throw new Error(`Chain ID mismatch: Expected 31337 for local Hardhat node, received ${chainId}`);
  }

  // 2. Load Deployment Artifact
  const deploymentFile = path.join(__dirname, "..", "deployments", "localhost.json");
  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment file missing at ${deploymentFile}. Please run 'npm run deploy:local' first.`);
  }
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const contractAddress = deployment.contractAddress;
  console.log(`Contract Addr  : ${contractAddress}`);

  // 3. Verify Contract Bytecode On-Chain
  const code = await hre.ethers.provider.getCode(contractAddress);
  if (!code || code === "0x") {
    throw new Error(
      `Zero bytecode found at ${contractAddress}. The contract is not deployed or the node was restarted without redeploying.`
    );
  }
  console.log(`On-Chain Code  : ${(code.length - 2) / 2} bytes detected ✓`);

  // 4. Attach and Execute Basic Read Operations
  const BlockLoan = await hre.ethers.getContractFactory("BlockLoan");
  const blockLoan = BlockLoan.attach(contractAddress);

  const loanCount = await blockLoan.getLoanCount();
  console.log(`Loan Counter   : ${loanCount.toString()} total loans recorded on-chain`);

  // Test calculation function
  const testPrincipal = hre.ethers.parseEther("1.0");
  const testRateBps = 1000n; // 10%
  const testDuration = 365n * 24n * 60n * 60n; // 1 year
  const calculatedTotal = await blockLoan.calculateRepaymentAmount(testPrincipal, testRateBps, testDuration);
  const expectedTotal = hre.ethers.parseEther("1.1");
  if (calculatedTotal !== expectedTotal) {
    throw new Error(`Arithmetic verification failed: expected 1.1 ETH, received ${hre.ethers.formatEther(calculatedTotal)}`);
  }
  console.log(`Math Engine    : Simple interest formula verified (1.0 ETH @ 10% 1y = ${hre.ethers.formatEther(calculatedTotal)} ETH) ✓`);

  // 5. Inspect Accounts and Balances
  console.log("\n-----------------------------------------------------------------");
  console.log("Verified Test Accounts & Native ETH Balances:");
  console.log("-----------------------------------------------------------------");
  const signers = await hre.ethers.getSigners();
  const roles = ["Account #0 (Deployer)", "Account #1 (Borrower)", "Account #2 (Lender)"];
  for (let i = 0; i < 3 && i < signers.length; i++) {
    const bal = await hre.ethers.provider.getBalance(signers[i].address);
    console.log(`${roles[i]} : ${signers[i].address} (${hre.ethers.formatEther(bal)} ETH)`);
  }

  // 6. Inspect Sample Loans if seeded
  if (loanCount > 0n) {
    console.log("\n-----------------------------------------------------------------");
    console.log("On-Chain Loan Records Sample:");
    console.log("-----------------------------------------------------------------");
    const statusLabels = ["OPEN", "ACTIVE", "COMPLETED", "DEFAULTED", "CANCELLED"];
    for (let i = 1; i <= Number(loanCount) && i <= 3; i++) {
      const loan = await blockLoan.getLoan(i);
      console.log(
        `Loan #${loan.id} [${statusLabels[loan.status]}] | Principal: ${hre.ethers.formatEther(loan.principalAmount)} ETH | Due: ${hre.ethers.formatEther(loan.totalDue)} ETH | Borrower: ${loan.borrower.substring(0, 8)}...`
      );
    }
  }

  console.log("\n=================================================================");
  console.log("          ALL LOCAL DEPLOYMENT VERIFICATIONS PASSED ✓            ");
  console.log("=================================================================\n");
}

main().catch((error) => {
  console.error("\n[VERIFICATION AUDIT FAILURE]:", error.message || error);
  process.exitCode = 1;
});
