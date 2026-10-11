const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BlockLoan Protocol Test Suite", function () {
  let blockLoan;
  let deployer, borrower, lender, thirdParty;

  // Test standard parameters: 1.0 ETH, 10% APR (1000 bps), 30 days
  const DEFAULT_PRINCIPAL = ethers.parseEther("1.0");
  const DEFAULT_RATE_BPS = 1000n; // 10.00% APR
  const DEFAULT_DURATION = 30n * 24n * 60n * 60n; // 30 days in seconds

  beforeEach(async function () {
    [deployer, borrower, lender, thirdParty] = await ethers.getSigners();
    const BlockLoan = await ethers.getContractFactory("BlockLoan");
    blockLoan = await BlockLoan.deploy();
    await blockLoan.waitForDeployment();
  });

  // ===========================================================================
  // 1. LOAN CREATION
  // ===========================================================================
  describe("1. Loan Creation", function () {
    it("should create a valid loan request and emit LoanCreated", async function () {
      await expect(
        blockLoan
          .connect(borrower)
          .createLoan(DEFAULT_PRINCIPAL, DEFAULT_RATE_BPS, DEFAULT_DURATION)
      )
        .to.emit(blockLoan, "LoanCreated")
        .withArgs(1, borrower.address, DEFAULT_PRINCIPAL, DEFAULT_RATE_BPS, DEFAULT_DURATION);

      expect(await blockLoan.getLoanCount()).to.equal(1);

      const loan = await blockLoan.getLoan(1);
      expect(loan.id).to.equal(1);
      expect(loan.borrower).to.equal(borrower.address);
      expect(loan.lender).to.equal(ethers.ZeroAddress);
      expect(loan.principalAmount).to.equal(DEFAULT_PRINCIPAL);
      expect(loan.interestRateBps).to.equal(DEFAULT_RATE_BPS);
      expect(loan.durationSeconds).to.equal(DEFAULT_DURATION);
      expect(loan.status).to.equal(0); // LoanStatus.OPEN
      expect(loan.totalDue).to.equal(0);
      expect(loan.totalRepaid).to.equal(0);
    });

    it("should reject principal amounts below minimum threshold", async function () {
      await expect(
        blockLoan.connect(borrower).createLoan(0, DEFAULT_RATE_BPS, DEFAULT_DURATION)
      ).to.be.revertedWithCustomError(blockLoan, "InvalidPrincipal");

      await expect(
        blockLoan.connect(borrower).createLoan(999, DEFAULT_RATE_BPS, DEFAULT_DURATION)
      ).to.be.revertedWithCustomError(blockLoan, "InvalidPrincipal");
    });

    it("should reject interest rate below minimum or above maximum caps", async function () {
      // Below 50 bps (0.5%)
      await expect(
        blockLoan.connect(borrower).createLoan(DEFAULT_PRINCIPAL, 49, DEFAULT_DURATION)
      ).to.be.revertedWithCustomError(blockLoan, "InvalidInterestRate");

      // Above 5000 bps (50%)
      await expect(
        blockLoan.connect(borrower).createLoan(DEFAULT_PRINCIPAL, 5001, DEFAULT_DURATION)
      ).to.be.revertedWithCustomError(blockLoan, "InvalidInterestRate");
    });

    it("should reject duration below minimum or above maximum caps", async function () {
      // Below 1 hour (3600s)
      await expect(
        blockLoan.connect(borrower).createLoan(DEFAULT_PRINCIPAL, DEFAULT_RATE_BPS, 3599)
      ).to.be.revertedWithCustomError(blockLoan, "InvalidDuration");

      // Above 365 days
      const exceedYear = 365n * 24n * 60n * 60n + 1n;
      await expect(
        blockLoan.connect(borrower).createLoan(DEFAULT_PRINCIPAL, DEFAULT_RATE_BPS, exceedYear)
      ).to.be.revertedWithCustomError(blockLoan, "InvalidDuration");
    });
  });

  // ===========================================================================
  // 2. LOAN FUNDING
  // ===========================================================================
  describe("2. Loan Funding", function () {
    let loanId;

    beforeEach(async function () {
      await blockLoan
        .connect(borrower)
        .createLoan(DEFAULT_PRINCIPAL, DEFAULT_RATE_BPS, DEFAULT_DURATION);
      loanId = 1;
    });

    it("should fund loan successfully, transfer principal to borrower, and record status", async function () {
      const borrowerBalanceBefore = await ethers.provider.getBalance(borrower.address);

      const tx = await blockLoan.connect(lender).fundLoan(loanId, {
        value: DEFAULT_PRINCIPAL,
      });

      const expectedTotalDue = await blockLoan.calculateRepaymentAmount(
        DEFAULT_PRINCIPAL,
        DEFAULT_RATE_BPS,
        DEFAULT_DURATION
      );

      const latestBlock = await ethers.provider.getBlock("latest");

      await expect(tx)
        .to.emit(blockLoan, "LoanFunded")
        .withArgs(
          loanId,
          lender.address,
          expectedTotalDue,
          BigInt(latestBlock.timestamp) + DEFAULT_DURATION
        );

      const borrowerBalanceAfter = await ethers.provider.getBalance(borrower.address);
      expect(borrowerBalanceAfter - borrowerBalanceBefore).to.equal(DEFAULT_PRINCIPAL);

      const loan = await blockLoan.getLoan(loanId);
      expect(loan.lender).to.equal(lender.address);
      expect(loan.status).to.equal(1); // LoanStatus.ACTIVE
      expect(loan.totalDue).to.equal(expectedTotalDue);
      expect(await blockLoan.getRepaymentAmount(loanId)).to.equal(expectedTotalDue);
    });

    it("should reject funding when caller is the borrower", async function () {
      await expect(
        blockLoan.connect(borrower).fundLoan(loanId, { value: DEFAULT_PRINCIPAL })
      ).to.be.revertedWithCustomError(blockLoan, "BorrowerCannotFund");
    });

    it("should reject funding with incorrect ETH amount", async function () {
      // Underpayment
      const underpay = ethers.parseEther("0.9");
      await expect(
        blockLoan.connect(lender).fundLoan(loanId, { value: underpay })
      ).to.be.revertedWithCustomError(blockLoan, "IncorrectFundingAmount");

      // Overpayment
      const overpay = ethers.parseEther("1.1");
      await expect(
        blockLoan.connect(lender).fundLoan(loanId, { value: overpay })
      ).to.be.revertedWithCustomError(blockLoan, "IncorrectFundingAmount");
    });

    it("should reject duplicate funding attempts", async function () {
      await blockLoan.connect(lender).fundLoan(loanId, { value: DEFAULT_PRINCIPAL });

      await expect(
        blockLoan.connect(thirdParty).fundLoan(loanId, { value: DEFAULT_PRINCIPAL })
      ).to.be.revertedWithCustomError(blockLoan, "InvalidLoanStatus");
    });

    it("should revert if funding a nonexistent loan", async function () {
      await expect(
        blockLoan.connect(lender).fundLoan(999, { value: DEFAULT_PRINCIPAL })
      ).to.be.revertedWithCustomError(blockLoan, "LoanNotFound");
    });
  });

  // ===========================================================================
  // 3. REPAYMENT & COMPLETION
  // ===========================================================================
  describe("3. Repayment & Completion", function () {
    let loanId;
    let totalDue;

    beforeEach(async function () {
      await blockLoan
        .connect(borrower)
        .createLoan(DEFAULT_PRINCIPAL, DEFAULT_RATE_BPS, DEFAULT_DURATION);
      loanId = 1;
      await blockLoan.connect(lender).fundLoan(loanId, { value: DEFAULT_PRINCIPAL });
      totalDue = await blockLoan.getRepaymentAmount(loanId);
    });

    it("should process partial repayments and forward ETH to lender", async function () {
      const partialPay = ethers.parseEther("0.4");
      const lenderBalanceBefore = await ethers.provider.getBalance(lender.address);

      await expect(
        blockLoan.connect(borrower).repayLoan(loanId, { value: partialPay })
      )
        .to.emit(blockLoan, "RepaymentMade")
        .withArgs(loanId, borrower.address, partialPay, totalDue - partialPay);

      const lenderBalanceAfter = await ethers.provider.getBalance(lender.address);
      expect(lenderBalanceAfter - lenderBalanceBefore).to.equal(partialPay);

      const remaining = await blockLoan.getRepaymentAmount(loanId);
      expect(remaining).to.equal(totalDue - partialPay);

      const loan = await blockLoan.getLoan(loanId);
      expect(loan.totalRepaid).to.equal(partialPay);
      expect(loan.status).to.equal(1); // Still ACTIVE
    });

    it("should mark loan COMPLETED upon settling full amount due", async function () {
      await expect(
        blockLoan.connect(borrower).repayLoan(loanId, { value: totalDue })
      )
        .to.emit(blockLoan, "RepaymentMade")
        .withArgs(loanId, borrower.address, totalDue, 0)
        .and.to.emit(blockLoan, "LoanCompleted")
        .withArgs(loanId, borrower.address, lender.address, totalDue);

      const loan = await blockLoan.getLoan(loanId);
      expect(loan.status).to.equal(2); // LoanStatus.COMPLETED
      expect(loan.totalRepaid).to.equal(totalDue);
      expect(await blockLoan.getRepaymentAmount(loanId)).to.equal(0);
    });

    it("should reject repayments from unauthorized non-borrower accounts", async function () {
      await expect(
        blockLoan.connect(thirdParty).repayLoan(loanId, { value: ethers.parseEther("0.1") })
      ).to.be.revertedWithCustomError(blockLoan, "OnlyBorrowerCanRepay");
    });

    it("should reject zero-value repayments", async function () {
      await expect(
        blockLoan.connect(borrower).repayLoan(loanId, { value: 0 })
      ).to.be.revertedWithCustomError(blockLoan, "ZeroPaymentNotAllowed");
    });

    it("should reject overpayment exceeding remaining amount due", async function () {
      const overpayment = totalDue + ethers.parseEther("0.01");
      await expect(
        blockLoan.connect(borrower).repayLoan(loanId, { value: overpayment })
      ).to.be.revertedWithCustomError(blockLoan, "RepaymentExceedsBalance");
    });

    it("should reject repayments after loan has completed", async function () {
      await blockLoan.connect(borrower).repayLoan(loanId, { value: totalDue });

      await expect(
        blockLoan.connect(borrower).repayLoan(loanId, { value: ethers.parseEther("0.01") })
      ).to.be.revertedWithCustomError(blockLoan, "InvalidLoanStatus");
    });
  });

  // ===========================================================================
  // 4. DEADLINE & DEFAULT BEHAVIOR
  // ===========================================================================
  describe("4. Deadline & Default Behavior", function () {
    let loanId;
    let deadline;

    beforeEach(async function () {
      await blockLoan
        .connect(borrower)
        .createLoan(DEFAULT_PRINCIPAL, DEFAULT_RATE_BPS, DEFAULT_DURATION);
      loanId = 1;
      await blockLoan.connect(lender).fundLoan(loanId, { value: DEFAULT_PRINCIPAL });
      const loan = await blockLoan.getLoan(loanId);
      deadline = loan.repaymentDeadline;
    });

    it("should disallow markDefaulted before the repayment deadline passes", async function () {
      await expect(
        blockLoan.connect(thirdParty).markDefaulted(loanId)
      ).to.be.revertedWithCustomError(blockLoan, "DeadlineNotPassed");
    });

    it("should reject borrower repayment after deadline passes", async function () {
      // Fast forward time past deadline
      await time.increaseTo(deadline + 10n);

      await expect(
        blockLoan.connect(borrower).repayLoan(loanId, { value: ethers.parseEther("0.1") })
      ).to.be.revertedWithCustomError(blockLoan, "DeadlinePassed");
    });

    it("should allow permissionless default marking after deadline expires", async function () {
      await time.increaseTo(deadline + 100n);

      const totalDue = await blockLoan.getRepaymentAmount(loanId);

      await expect(blockLoan.connect(thirdParty).markDefaulted(loanId))
        .to.emit(blockLoan, "LoanDefaulted")
        .withArgs(loanId, borrower.address, lender.address, totalDue);

      const loan = await blockLoan.getLoan(loanId);
      expect(loan.status).to.equal(3); // LoanStatus.DEFAULTED
    });

    it("should reject markDefaulted on an already COMPLETED loan", async function () {
      const totalDue = await blockLoan.getRepaymentAmount(loanId);
      await blockLoan.connect(borrower).repayLoan(loanId, { value: totalDue });

      await time.increaseTo(deadline + 50n);

      await expect(
        blockLoan.connect(thirdParty).markDefaulted(loanId)
      ).to.be.revertedWithCustomError(blockLoan, "InvalidLoanStatus");
    });
  });

  // ===========================================================================
  // 5. CANCELLATION & EDGE CASES
  // ===========================================================================
  describe("5. Cancellation & Edge Cases", function () {
    let loanId;

    beforeEach(async function () {
      await blockLoan
        .connect(borrower)
        .createLoan(DEFAULT_PRINCIPAL, DEFAULT_RATE_BPS, DEFAULT_DURATION);
      loanId = 1;
    });

    it("should allow borrower to cancel OPEN loan request", async function () {
      await expect(blockLoan.connect(borrower).cancelLoan(loanId))
        .to.emit(blockLoan, "LoanCancelled")
        .withArgs(loanId, borrower.address);

      const loan = await blockLoan.getLoan(loanId);
      expect(loan.status).to.equal(4); // LoanStatus.CANCELLED
    });

    it("should reject cancelLoan from non-borrower accounts", async function () {
      await expect(
        blockLoan.connect(thirdParty).cancelLoan(loanId)
      ).to.be.revertedWithCustomError(blockLoan, "OnlyBorrowerCanCancel");
    });

    it("should prevent funding a cancelled loan", async function () {
      await blockLoan.connect(borrower).cancelLoan(loanId);

      await expect(
        blockLoan.connect(lender).fundLoan(loanId, { value: DEFAULT_PRINCIPAL })
      ).to.be.revertedWithCustomError(blockLoan, "InvalidLoanStatus");
    });

    it("should revert getLoan on nonexistent index", async function () {
      await expect(blockLoan.getLoan(0)).to.be.revertedWithCustomError(
        blockLoan,
        "LoanNotFound"
      );
      await expect(blockLoan.getLoan(50)).to.be.revertedWithCustomError(
        blockLoan,
        "LoanNotFound"
      );
    });
  });
});
