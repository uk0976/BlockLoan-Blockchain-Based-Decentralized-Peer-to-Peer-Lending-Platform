const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Phase 4: Frontend Contract Integration & Two-Wallet Lifecycle", function () {
  let blockLoan;
  let deployer, borrower, lender, unauthorizedUser;

  const PRINCIPAL_ETH = "2.5";
  const PRINCIPAL_WEI = ethers.parseEther(PRINCIPAL_ETH);
  const INTEREST_BPS = 950n; // 9.5% APR
  const DURATION_SECONDS = 60n * 86400n; // 60 days

  beforeEach(async function () {
    [deployer, borrower, lender, unauthorizedUser] = await ethers.getSigners();
    const BlockLoan = await ethers.getContractFactory("BlockLoan");
    blockLoan = await BlockLoan.deploy();
    await blockLoan.waitForDeployment();
  });

  it("Step 1: Borrower creates loan request on-chain", async function () {
    const tx = await blockLoan.connect(borrower).createLoan(PRINCIPAL_WEI, INTEREST_BPS, DURATION_SECONDS);
    const receipt = await tx.wait();

    // Verify event
    const createdFilter = blockLoan.filters.LoanCreated();
    const logs = await blockLoan.queryFilter(createdFilter, receipt.blockNumber);
    expect(logs.length).to.equal(1);
    expect(logs[0].args[0]).to.equal(1n);
    expect(logs[0].args[1]).to.equal(borrower.address);
    expect(logs[0].args[2]).to.equal(PRINCIPAL_WEI);

    // Verify on-chain state
    const loan = await blockLoan.getLoan(1);
    expect(loan.id).to.equal(1n);
    expect(loan.borrower).to.equal(borrower.address);
    expect(loan.status).to.equal(0); // OPEN
    expect(loan.lender).to.equal(ethers.ZeroAddress);
  });

  it("Step 2: Rejects borrower trying to fund their own loan", async function () {
    await blockLoan.connect(borrower).createLoan(PRINCIPAL_WEI, INTEREST_BPS, DURATION_SECONDS);

    await expect(
      blockLoan.connect(borrower).fundLoan(1, { value: PRINCIPAL_WEI })
    ).to.be.revertedWithCustomError(blockLoan, "BorrowerCannotFund");
  });

  it("Step 3: Separate Lender funds loan with exact principal in native test ETH", async function () {
    await blockLoan.connect(borrower).createLoan(PRINCIPAL_WEI, INTEREST_BPS, DURATION_SECONDS);

    const borrowerBalanceBefore = await ethers.provider.getBalance(borrower.address);

    const tx = await blockLoan.connect(lender).fundLoan(1, { value: PRINCIPAL_WEI });
    const receipt = await tx.wait();

    // Check borrower received exact principal
    const borrowerBalanceAfter = await ethers.provider.getBalance(borrower.address);
    expect(borrowerBalanceAfter - borrowerBalanceBefore).to.equal(PRINCIPAL_WEI);

    // Verify on-chain state
    const loan = await blockLoan.getLoan(1);
    expect(loan.status).to.equal(1); // ACTIVE
    expect(loan.lender).to.equal(lender.address);
    expect(loan.totalDue).to.be.gt(PRINCIPAL_WEI);

    // Verify LoanFunded event query
    const fundedFilter = blockLoan.filters.LoanFunded();
    const logs = await blockLoan.queryFilter(fundedFilter, receipt.blockNumber);
    expect(logs.length).to.equal(1);
    expect(logs[0].args[1]).to.equal(lender.address);
    expect(logs[0].args[2]).to.equal(loan.totalDue);
  });

  it("Step 4: Only borrower can submit repayments", async function () {
    await blockLoan.connect(borrower).createLoan(PRINCIPAL_WEI, INTEREST_BPS, DURATION_SECONDS);
    await blockLoan.connect(lender).fundLoan(1, { value: PRINCIPAL_WEI });

    const partialWei = ethers.parseEther("0.5");
    await expect(
      blockLoan.connect(unauthorizedUser).repayLoan(1, { value: partialWei })
    ).to.be.revertedWithCustomError(blockLoan, "OnlyBorrowerCanRepay");
  });

  it("Step 5: Full lifecycle with partial and full settlement forwards ETH to lender", async function () {
    await blockLoan.connect(borrower).createLoan(PRINCIPAL_WEI, INTEREST_BPS, DURATION_SECONDS);
    await blockLoan.connect(lender).fundLoan(1, { value: PRINCIPAL_WEI });

    const initialTotalDue = await blockLoan.getRepaymentAmount(1);

    // 1. Partial Repayment of 1.0 ETH
    const partialWei = ethers.parseEther("1.0");
    const lenderBalanceBefore = await ethers.provider.getBalance(lender.address);

    await blockLoan.connect(borrower).repayLoan(1, { value: partialWei });

    const lenderBalanceAfter = await ethers.provider.getBalance(lender.address);
    expect(lenderBalanceAfter - lenderBalanceBefore).to.equal(partialWei);

    const remainingDue = await blockLoan.getRepaymentAmount(1);
    expect(remainingDue).to.equal(initialTotalDue - partialWei);

    // Loan is still ACTIVE
    let loan = await blockLoan.getLoan(1);
    expect(loan.status).to.equal(1); // ACTIVE
    expect(loan.totalRepaid).to.equal(partialWei);

    // 2. Final Settlement of remaining amount due
    await blockLoan.connect(borrower).repayLoan(1, { value: remainingDue });

    // Loan is now COMPLETED
    loan = await blockLoan.getLoan(1);
    expect(loan.status).to.equal(2); // COMPLETED
    expect(loan.totalRepaid).to.equal(initialTotalDue);
    expect(await blockLoan.getRepaymentAmount(1)).to.equal(0n);
  });

  it("Step 6: QueryFilter discovers all historical events matching frontend requirements", async function () {
    // Execute a full sequence
    await blockLoan.connect(borrower).createLoan(PRINCIPAL_WEI, INTEREST_BPS, DURATION_SECONDS);
    await blockLoan.connect(lender).fundLoan(1, { value: PRINCIPAL_WEI });
    const totalDue = await blockLoan.getRepaymentAmount(1);
    await blockLoan.connect(borrower).repayLoan(1, { value: totalDue });

    // Run filters like frontend does
    const [created, funded, repaid, completed] = await Promise.all([
      blockLoan.queryFilter(blockLoan.filters.LoanCreated()),
      blockLoan.queryFilter(blockLoan.filters.LoanFunded()),
      blockLoan.queryFilter(blockLoan.filters.RepaymentMade()),
      blockLoan.queryFilter(blockLoan.filters.LoanCompleted()),
    ]);

    expect(created.length).to.equal(1);
    expect(funded.length).to.equal(1);
    expect(repaid.length).to.equal(1);
    expect(completed.length).to.equal(1);
  });
});
