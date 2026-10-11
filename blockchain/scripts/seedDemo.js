const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=================================================================");
  console.log("         BlockLoan — Reproducible On-Chain Demo Seeding          ");
  console.log("=================================================================");

  // Read deployment file
  const deploymentFile = path.join(__dirname, "..", "deployments", "localhost.json");
  if (!fs.existsSync(deploymentFile)) {
    throw new Error(
      `Deployment artifact not found at ${deploymentFile}. Please deploy the contract first using 'npm run deploy:local'.`
    );
  }
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const contractAddress = deployment.contractAddress;

  console.log(`Connecting to BlockLoan at: ${contractAddress}`);
  const BlockLoan = await hre.ethers.getContractFactory("BlockLoan");
  const blockLoan = BlockLoan.attach(contractAddress);

  // Signers
  const [deployer, borrower, lender] = await hre.ethers.getSigners();
  console.log(`Borrower Account (#1) : ${borrower.address}`);
  console.log(`Lender Account   (#2) : ${lender.address}`);

  const initialCount = await blockLoan.getLoanCount();
  console.log(`Current Loan Count    : ${initialCount.toString()}`);

  if (initialCount > 0n) {
    console.log("\nNotice: Contract already contains loans. Adding demonstration loans...\n");
  }

  // ---------------------------------------------------------------------------
  // Seed 1: OPEN Loan Request (Ready for Lender to fund in DApp)
  // ---------------------------------------------------------------------------
  console.log("\n[Seed 1] Creating OPEN loan proposal by Borrower...");
  const p1 = hre.ethers.parseEther("1.5");
  const rate1 = 850n; // 8.50% APR
  const dur1 = 30n * 24n * 60n * 60n; // 30 days
  const tx1 = await blockLoan.connect(borrower).createLoan(p1, rate1, dur1);
  await tx1.wait();
  const id1 = await blockLoan.getLoanCount();
  console.log(`✓ Loan #${id1} Created (Status: OPEN, Principal: 1.5 ETH, APR: 8.5%, Term: 30d)`);

  // ---------------------------------------------------------------------------
  // Seed 2: ACTIVE Loan (Funded by Lender, Ready for Borrower Repayment)
  // ---------------------------------------------------------------------------
  console.log("\n[Seed 2] Creating and funding ACTIVE loan...");
  const p2 = hre.ethers.parseEther("2.5");
  const rate2 = 1000n; // 10.00% APR
  const dur2 = 60n * 24n * 60n * 60n; // 60 days
  const tx2Create = await blockLoan.connect(borrower).createLoan(p2, rate2, dur2);
  await tx2Create.wait();
  const id2 = await blockLoan.getLoanCount();

  const tx2Fund = await blockLoan.connect(lender).fundLoan(id2, { value: p2 });
  await tx2Fund.wait();
  const due2 = await blockLoan.getRepaymentAmount(id2);
  console.log(`✓ Loan #${id2} Funded by Lender (Status: ACTIVE, Principal: 2.5 ETH, Total Due: ${hre.ethers.formatEther(due2)} ETH)`);

  // ---------------------------------------------------------------------------
  // Seed 3: COMPLETED Loan (Created, Funded, and Fully Repaid)
  // ---------------------------------------------------------------------------
  console.log("\n[Seed 3] Creating, funding, and fully repaying COMPLETED loan...");
  const p3 = hre.ethers.parseEther("0.5");
  const rate3 = 600n; // 6.00% APR
  const dur3 = 15n * 24n * 60n * 60n; // 15 days
  const tx3Create = await blockLoan.connect(borrower).createLoan(p3, rate3, dur3);
  await tx3Create.wait();
  const id3 = await blockLoan.getLoanCount();

  const tx3Fund = await blockLoan.connect(lender).fundLoan(id3, { value: p3 });
  await tx3Fund.wait();

  const due3 = await blockLoan.getRepaymentAmount(id3);
  const tx3Repay = await blockLoan.connect(borrower).repayLoan(id3, { value: due3 });
  await tx3Repay.wait();
  console.log(`✓ Loan #${id3} Fully Repaid by Borrower (Status: COMPLETED, Repaid: ${hre.ethers.formatEther(due3)} ETH)`);

  console.log("\n=================================================================");
  console.log(`Seeding complete! Total on-chain loans: ${await blockLoan.getLoanCount()}`);
  console.log("=================================================================\n");
}

main().catch((error) => {
  console.error("\n[SEED ERROR]:", error.message || error);
  process.exitCode = 1;
});
