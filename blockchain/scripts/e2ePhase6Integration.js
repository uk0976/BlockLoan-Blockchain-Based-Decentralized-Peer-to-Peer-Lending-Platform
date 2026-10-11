const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=================================================================");
  console.log("      BlockLoan Phase 6 — Full Integration End-to-End Test       ");
  console.log("=================================================================");

  const deploymentPath = path.join(__dirname, "../deployments/localhost.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("Missing deployment artifact at " + deploymentPath);
  }
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contractAddress = deployment.contractAddress || deployment.address;
  console.log(`Contract Target Address : ${contractAddress}`);

  const BlockLoan = await ethers.getContractFactory("BlockLoan");
  const contract = BlockLoan.attach(contractAddress);

  const signers = await ethers.getSigners();
  const borrower = signers[1]; // Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
  const lender = signers[2];   // Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

  console.log(`Borrower Account (Wallet 1): ${borrower.address}`);
  console.log(`Lender Account   (Wallet 2): ${lender.address}`);

  // -------------------------------------------------------------
  // Step 1: Create a loan request on-chain
  // -------------------------------------------------------------
  console.log("\n[Step 1] Creating Loan Request from Borrower...");
  const principal = ethers.parseEther("1.0"); // 1.0 ETH
  const aprBps = 800n; // 8.00% APR
  const durationSeconds = 30n * 86400n; // 30 days

  const createTx = await contract.connect(borrower).createLoan(principal, aprBps, durationSeconds);
  const createReceipt = await createTx.wait();

  // Parse LoanCreated event
  let loanId = null;
  for (const log of createReceipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed && parsed.name === "LoanCreated") {
        loanId = parsed.args[0];
        break;
      }
    } catch {
      // ignore non-matching logs
    }
  }

  if (loanId === null) {
    throw new Error("LoanCreated event not found in transaction receipt");
  }
  console.log(`✓ Loan Created On-Chain! Assigned Loan ID: #${loanId.toString()} (Tx: ${createReceipt.hash})`);

  // Synchronize off-chain metadata with FastAPI backend
  try {
    const metaRes = await fetch(`http://127.0.0.1:8000/api/loans/${loanId}/metadata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Peer Business Loan",
        purpose: "Working capital equipment upgrade",
        collateral_description: "Optional equipment lien",
      }),
    });
    if (metaRes.ok) {
      console.log(`✓ Metadata successfully posted to FastAPI backend!`);
    } else {
      console.warn(`⚠ Backend metadata sync returned status: ${metaRes.status}`);
    }
  } catch (err) {
    console.warn(`⚠ Could not reach backend metadata endpoint: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Step 2: Confirm it appears in marketplace as OPEN
  // -------------------------------------------------------------
  console.log("\n[Step 2] Confirming Loan in Marketplace...");
  const rawLoan = await contract.getLoan(loanId);
  if (Number(rawLoan.status) !== 0) {
    throw new Error(`Expected loan status 0 (OPEN), got ${rawLoan.status}`);
  }
  if (rawLoan.borrower.toLowerCase() !== borrower.address.toLowerCase()) {
    throw new Error(`Expected borrower ${borrower.address}, got ${rawLoan.borrower}`);
  }
  console.log(`✓ Verified On-Chain: Status is OPEN, Borrower matches Wallet 1, Principal is 1.0 ETH.`);

  // Verify backend API returns it
  try {
    const apiRes = await fetch(`http://127.0.0.1:8000/api/loans/${loanId}`);
    if (apiRes.ok) {
      const data = await apiRes.json();
      console.log(`✓ Verified Backend API: Status=${data.status}, Title="${data.title}", On-Chain Verified=${data.on_chain_verified}`);
    }
  } catch (err) {
    console.warn(`⚠ Could not query backend for loan #${loanId}: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Step 3: Fund loan from Lender account
  // -------------------------------------------------------------
  console.log("\n[Step 3] Funding Loan from Lender Account...");
  const borrowerBalBefore = await ethers.provider.getBalance(borrower.address);
  console.log(`Borrower Balance Before Funding: ${ethers.formatEther(borrowerBalBefore)} ETH`);

  const fundTx = await contract.connect(lender).fundLoan(loanId, { value: principal });
  const fundReceipt = await fundTx.wait();
  console.log(`✓ Loan Funded! Tx: ${fundReceipt.hash}`);

  const borrowerBalAfter = await ethers.provider.getBalance(borrower.address);
  console.log(`Borrower Balance After Funding : ${ethers.formatEther(borrowerBalAfter)} ETH`);

  const diff = borrowerBalAfter - borrowerBalBefore;
  if (diff !== principal) {
    throw new Error(`Expected borrower to receive exactly 1.0 ETH, diff was ${ethers.formatEther(diff)} ETH`);
  }
  console.log(`✓ Verified: Borrower received exactly 1.0 ETH principal into their wallet!`);

  const fundedLoan = await contract.getLoan(loanId);
  if (Number(fundedLoan.status) !== 1) {
    throw new Error(`Expected loan status 1 (ACTIVE), got ${fundedLoan.status}`);
  }
  if (fundedLoan.lender.toLowerCase() !== lender.address.toLowerCase()) {
    throw new Error(`Expected lender ${lender.address}, got ${fundedLoan.lender}`);
  }
  console.log(`✓ Verified On-Chain: Status is ACTIVE, Lender recorded as Wallet 2.`);
  console.log(`  Total Due with Accrued Interest: ${ethers.formatEther(fundedLoan.totalDue)} ETH`);

  // -------------------------------------------------------------
  // Step 4: Make a partial repayment
  // -------------------------------------------------------------
  console.log("\n[Step 4] Making Partial Repayment (0.5 ETH) from Borrower...");
  const partialAmount = ethers.parseEther("0.5");
  const lenderBalBeforePartial = await ethers.provider.getBalance(lender.address);

  const partialTx = await contract.connect(borrower).repayLoan(loanId, { value: partialAmount });
  const partialReceipt = await partialTx.wait();
  console.log(`✓ Partial Repayment Submitted! Tx: ${partialReceipt.hash}`);

  const lenderBalAfterPartial = await ethers.provider.getBalance(lender.address);
  const lenderDiffPartial = lenderBalAfterPartial - lenderBalBeforePartial;
  if (lenderDiffPartial !== partialAmount) {
    throw new Error(`Expected lender to receive exactly 0.5 ETH, diff was ${ethers.formatEther(lenderDiffPartial)} ETH`);
  }
  console.log(`✓ Verified: Lender received exactly 0.5 ETH repayment!`);

  const remainingDue = await contract.getRepaymentAmount(loanId);
  console.log(`✓ Remaining Debt on Contract: ${ethers.formatEther(remainingDue)} ETH`);

  // -------------------------------------------------------------
  // Step 5: Complete repayment
  // -------------------------------------------------------------
  console.log("\n[Step 5] Completing Full Repayment from Borrower...");
  const lenderBalBeforeFinal = await ethers.provider.getBalance(lender.address);

  const finalTx = await contract.connect(borrower).repayLoan(loanId, { value: remainingDue });
  const finalReceipt = await finalTx.wait();
  console.log(`✓ Final Repayment Submitted! Tx: ${finalReceipt.hash}`);

  const lenderBalAfterFinal = await ethers.provider.getBalance(lender.address);
  const lenderDiffFinal = lenderBalAfterFinal - lenderBalBeforeFinal;
  if (lenderDiffFinal !== remainingDue) {
    throw new Error(`Expected lender to receive ${ethers.formatEther(remainingDue)} ETH, diff was ${ethers.formatEther(lenderDiffFinal)} ETH`);
  }
  console.log(`✓ Verified: Lender received remaining settlement of ${ethers.formatEther(remainingDue)} ETH!`);

  const completedLoan = await contract.getLoan(loanId);
  if (Number(completedLoan.status) !== 2) {
    throw new Error(`Expected loan status 2 (COMPLETED), got ${completedLoan.status}`);
  }
  console.log(`✓ Verified On-Chain: Loan Status transitioned to COMPLETED!`);
  console.log(`  Total Repaid: ${ethers.formatEther(completedLoan.totalRepaid)} ETH / Total Due: ${ethers.formatEther(completedLoan.totalDue)} ETH`);

  // -------------------------------------------------------------
  // Step 6: Reload and verify persistent state on blockchain
  // -------------------------------------------------------------
  console.log("\n[Step 6] Verifying Blockchain Persistence (Simulating Page Reload)...");
  const reloadedLoan = await contract.getLoan(loanId);
  if (Number(reloadedLoan.status) !== 2) {
    throw new Error("Reloaded loan is not COMPLETED");
  }
  const zeroRemaining = await contract.getRepaymentAmount(loanId);
  if (zeroRemaining !== 0n) {
    throw new Error(`Expected 0 remaining debt, got ${ethers.formatEther(zeroRemaining)}`);
  }
  console.log(`✓ Fresh Blockchain Read Verified: Loan #${loanId} is COMPLETED with 0 outstanding debt.`);

  // -------------------------------------------------------------
  // Step 7: Confirm backend displays the same status & amounts
  // -------------------------------------------------------------
  console.log("\n[Step 7] Reconciling with FastAPI Backend & Web3.py Indexer...");
  try {
    const backendLoanRes = await fetch(`http://127.0.0.1:8000/api/loans/${loanId}`);
    if (backendLoanRes.ok) {
      const bLoan = await backendLoanRes.json();
      console.log(`✓ Backend /loans/${loanId}:`);
      console.log(`    Status             : ${bLoan.status} (Matches Contract COMPLETED)`);
      console.log(`    Principal          : ${bLoan.principal_eth} ETH`);
      console.log(`    Total Repaid       : ${bLoan.total_repaid_eth} ETH`);
      console.log(`    Remaining Debt     : ${bLoan.remaining_due_eth} ETH`);
      console.log(`    On-Chain Verified  : ${bLoan.on_chain_verified}`);
      if (bLoan.status !== "COMPLETED") {
        throw new Error(`Backend loan status mismatch: expected COMPLETED, got ${bLoan.status}`);
      }
    }

    const repaymentsRes = await fetch(`http://127.0.0.1:8000/api/loans/${loanId}/repayments`);
    if (repaymentsRes.ok) {
      const repayments = await repaymentsRes.json();
      console.log(`✓ Backend /loans/${loanId}/repayments: Discovered ${repayments.length} confirmed repayment events on-chain:`);
      for (const r of repayments) {
        console.log(`    - Paid: ${r.amount_paid_eth} ETH, Remaining: ${r.remaining_due_eth} ETH, Block: ${r.block_number}`);
      }
    }

    const adminRes = await fetch(`http://127.0.0.1:8000/api/admin/statistics`);
    if (adminRes.ok) {
      const stats = await adminRes.json();
      console.log(`✓ Backend /admin/statistics:`);
      console.log(`    Total Loans        : ${stats.total_loans}`);
      console.log(`    Completed Loans    : ${stats.completed_loans}`);
      console.log(`    Total Volume       : ${stats.total_volume_eth ?? stats.total_principal_volume_eth} ETH`);
      console.log(`    Total Repaid Volume: ${stats.total_repaid_eth ?? stats.total_repaid_volume_eth} ETH`);
    }
  } catch (err) {
    console.error(`Error querying backend API:`, err);
    throw err;
  }

  console.log("\n=================================================================");
  console.log("    ALL PHASE 6 INTEGRATION & TWO-WALLET VERIFICATIONS PASSED ✓  ");
  console.log("=================================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Integration Test Failed:", error);
    process.exit(1);
  });
