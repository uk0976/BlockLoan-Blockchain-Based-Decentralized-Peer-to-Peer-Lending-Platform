const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Phase 7: Smart Contract Security, Negative Tests & Edge Cases", function () {
  let BlockLoan;
  let contract;
  let deployer, borrower, lender, stranger;

  const ONE_ETH = ethers.parseEther("1.0");
  const TEN_PERCENT_BPS = 1000n; // 10.00%
  const THIRTY_DAYS = 30n * 86400n;

  beforeEach(async function () {
    [deployer, borrower, lender, stranger] = await ethers.getSigners();
    BlockLoan = await ethers.getContractFactory("BlockLoan");
    contract = await BlockLoan.deploy();
    await contract.waitForDeployment();
  });

  // =========================================================================
  // 1. INPUT VALIDATION & PARAMETER BOUNDARIES
  // =========================================================================
  describe("Input Validation & Parameter Boundaries", function () {
    it("should reject principal below MIN_PRINCIPAL (999 wei)", async function () {
      await expect(
        contract.connect(borrower).createLoan(999n, TEN_PERCENT_BPS, THIRTY_DAYS)
      ).to.be.revertedWithCustomError(contract, "InvalidPrincipal").withArgs(999n);
    });

    it("should accept exact MIN_PRINCIPAL threshold (1000 wei)", async function () {
      await expect(
        contract.connect(borrower).createLoan(1000n, TEN_PERCENT_BPS, THIRTY_DAYS)
      ).to.emit(contract, "LoanCreated").withArgs(1, borrower.address, 1000n, TEN_PERCENT_BPS, THIRTY_DAYS);
    });

    it("should reject interest rate below MIN_INTEREST_RATE_BPS (49 bps)", async function () {
      await expect(
        contract.connect(borrower).createLoan(ONE_ETH, 49n, THIRTY_DAYS)
      ).to.be.revertedWithCustomError(contract, "InvalidInterestRate").withArgs(49n);
    });

    it("should reject interest rate above MAX_INTEREST_RATE_BPS (5001 bps)", async function () {
      await expect(
        contract.connect(borrower).createLoan(ONE_ETH, 5001n, THIRTY_DAYS)
      ).to.be.revertedWithCustomError(contract, "InvalidInterestRate").withArgs(5001n);
    });

    it("should accept exact boundary interest rates (50 bps and 5000 bps)", async function () {
      await expect(
        contract.connect(borrower).createLoan(ONE_ETH, 50n, THIRTY_DAYS)
      ).to.emit(contract, "LoanCreated");

      await expect(
        contract.connect(borrower).createLoan(ONE_ETH, 5000n, THIRTY_DAYS)
      ).to.emit(contract, "LoanCreated");
    });

    it("should reject duration below MIN_DURATION (3599 seconds)", async function () {
      await expect(
        contract.connect(borrower).createLoan(ONE_ETH, TEN_PERCENT_BPS, 3599n)
      ).to.be.revertedWithCustomError(contract, "InvalidDuration").withArgs(3599n);
    });

    it("should reject duration above MAX_DURATION (365 days + 1 sec)", async function () {
      const maxPlusOne = 365n * 86400n + 1n;
      await expect(
        contract.connect(borrower).createLoan(ONE_ETH, TEN_PERCENT_BPS, maxPlusOne)
      ).to.be.revertedWithCustomError(contract, "InvalidDuration").withArgs(maxPlusOne);
    });
  });

  // =========================================================================
  // 2. NONEXISTENT RESOURCE CHECKS
  // =========================================================================
  describe("Nonexistent Resource Handling", function () {
    it("should revert with LoanNotFound on loanId 0", async function () {
      await expect(contract.connect(lender).fundLoan(0, { value: ONE_ETH }))
        .to.be.revertedWithCustomError(contract, "LoanNotFound").withArgs(0);

      await expect(contract.connect(borrower).repayLoan(0, { value: ONE_ETH }))
        .to.be.revertedWithCustomError(contract, "LoanNotFound").withArgs(0);

      await expect(contract.connect(borrower).cancelLoan(0))
        .to.be.revertedWithCustomError(contract, "LoanNotFound").withArgs(0);

      await expect(contract.markDefaulted(0))
        .to.be.revertedWithCustomError(contract, "LoanNotFound").withArgs(0);

      await expect(contract.getLoan(0))
        .to.be.revertedWithCustomError(contract, "LoanNotFound").withArgs(0);

      await expect(contract.getRepaymentAmount(0))
        .to.be.revertedWithCustomError(contract, "LoanNotFound").withArgs(0);
    });

    it("should revert with LoanNotFound on loanId exceeding counter", async function () {
      await expect(contract.connect(lender).fundLoan(999, { value: ONE_ETH }))
        .to.be.revertedWithCustomError(contract, "LoanNotFound").withArgs(999);
    });
  });

  // =========================================================================
  // 3. DUPLICATE FUNDING & INVALID STATE TRANSITIONS
  // =========================================================================
  describe("Duplicate Funding & State Transitions", function () {
    let loanId;

    beforeEach(async function () {
      await contract.connect(borrower).createLoan(ONE_ETH, TEN_PERCENT_BPS, THIRTY_DAYS);
      loanId = 1;
    });

    it("should prevent duplicate funding of an already ACTIVE loan", async function () {
      // First fund succeeds
      await contract.connect(lender).fundLoan(loanId, { value: ONE_ETH });

      // Second fund attempt by stranger reverts
      await expect(
        contract.connect(stranger).fundLoan(loanId, { value: ONE_ETH })
      ).to.be.revertedWithCustomError(contract, "InvalidLoanStatus");
    });

    it("should prevent funding a CANCELLED loan", async function () {
      await contract.connect(borrower).cancelLoan(loanId);
      await expect(
        contract.connect(lender).fundLoan(loanId, { value: ONE_ETH })
      ).to.be.revertedWithCustomError(contract, "InvalidLoanStatus");
    });

    it("should prevent repayLoan on an OPEN (unfunded) loan", async function () {
      await expect(
        contract.connect(borrower).repayLoan(loanId, { value: ONE_ETH })
      ).to.be.revertedWithCustomError(contract, "InvalidLoanStatus");
    });

    it("should prevent cancelLoan once loan is ACTIVE", async function () {
      await contract.connect(lender).fundLoan(loanId, { value: ONE_ETH });
      await expect(
        contract.connect(borrower).cancelLoan(loanId)
      ).to.be.revertedWithCustomError(contract, "InvalidLoanStatus");
    });

    it("should prevent non-borrower from cancelling an OPEN loan", async function () {
      await expect(
        contract.connect(stranger).cancelLoan(loanId)
      ).to.be.revertedWithCustomError(contract, "OnlyBorrowerCanCancel");
    });
  });

  // =========================================================================
  // 4. UNAUTHORIZED REPAYMENTS & PAYMENT BOUNDARIES
  // =========================================================================
  describe("Repayment Authorization & Payment Boundaries", function () {
    let loanId;

    beforeEach(async function () {
      await contract.connect(borrower).createLoan(ONE_ETH, TEN_PERCENT_BPS, THIRTY_DAYS);
      loanId = 1;
      await contract.connect(lender).fundLoan(loanId, { value: ONE_ETH });
    });

    it("should reject repayments from unauthorized stranger account", async function () {
      await expect(
        contract.connect(stranger).repayLoan(loanId, { value: ethers.parseEther("0.1") })
      ).to.be.revertedWithCustomError(contract, "OnlyBorrowerCanRepay");
    });

    it("should reject repayments from the lender account itself", async function () {
      await expect(
        contract.connect(lender).repayLoan(loanId, { value: ethers.parseEther("0.1") })
      ).to.be.revertedWithCustomError(contract, "OnlyBorrowerCanRepay");
    });

    it("should reject zero-value repayments", async function () {
      await expect(
        contract.connect(borrower).repayLoan(loanId, { value: 0 })
      ).to.be.revertedWithCustomError(contract, "ZeroPaymentNotAllowed");
    });

    it("should reject overpayment exceeding total amount due", async function () {
      const remainingDue = await contract.getRepaymentAmount(loanId);
      const excessiveAmount = remainingDue + ethers.parseEther("0.01");

      await expect(
        contract.connect(borrower).repayLoan(loanId, { value: excessiveAmount })
      ).to.be.revertedWithCustomError(contract, "RepaymentExceedsBalance");
    });
  });

  // =========================================================================
  // 5. DEADLINE, DEFAULT & TIMELOCK BEHAVIOR
  // =========================================================================
  describe("Deadline & Default Handling", function () {
    let loanId;

    beforeEach(async function () {
      await contract.connect(borrower).createLoan(ONE_ETH, TEN_PERCENT_BPS, THIRTY_DAYS);
      loanId = 1;
      await contract.connect(lender).fundLoan(loanId, { value: ONE_ETH });
    });

    it("should disallow markDefaulted before deadline passes", async function () {
      await expect(contract.markDefaulted(loanId))
        .to.be.revertedWithCustomError(contract, "DeadlineNotPassed");
    });

    it("should disallow markDefaulted on an OPEN loan", async function () {
      await contract.connect(borrower).createLoan(ONE_ETH, TEN_PERCENT_BPS, THIRTY_DAYS);
      const openLoanId = 2;
      await expect(contract.markDefaulted(openLoanId))
        .to.be.revertedWithCustomError(contract, "InvalidLoanStatus");
    });

    it("should reject borrower repayment after repayment deadline expires", async function () {
      await time.increase(THIRTY_DAYS + 1n);

      await expect(
        contract.connect(borrower).repayLoan(loanId, { value: ethers.parseEther("0.1") })
      ).to.be.revertedWithCustomError(contract, "DeadlinePassed");
    });

    it("should allow permissionless markDefaulted strictly after deadline passes", async function () {
      await time.increase(THIRTY_DAYS + 1n);

      await expect(contract.connect(stranger).markDefaulted(loanId))
        .to.emit(contract, "LoanDefaulted");

      const loan = await contract.getLoan(loanId);
      expect(loan.status).to.equal(3); // DEFAULTED
    });

    it("should reject calling markDefaulted on an already DEFAULTED loan", async function () {
      await time.increase(THIRTY_DAYS + 1n);
      await contract.markDefaulted(loanId);

      await expect(contract.markDefaulted(loanId))
        .to.be.revertedWithCustomError(contract, "InvalidLoanStatus");
    });

    it("should reject calling markDefaulted on a COMPLETED loan", async function () {
      const remainingDue = await contract.getRepaymentAmount(loanId);
      await contract.connect(borrower).repayLoan(loanId, { value: remainingDue });

      await time.increase(THIRTY_DAYS + 100n);
      await expect(contract.markDefaulted(loanId))
        .to.be.revertedWithCustomError(contract, "InvalidLoanStatus");
    });
  });

  // =========================================================================
  // 6. CONTRACT BALANCE INVARIANTS & TRAPPED FUNDS PREVENTION
  // =========================================================================
  describe("Unexpected ETH Transfers & Balance Invariants", function () {
    it("should reject plain direct ETH transfers without function call", async function () {
      await expect(
        stranger.sendTransaction({
          to: await contract.getAddress(),
          value: ethers.parseEther("0.5"),
        })
      ).to.be.reverted; // No receive() or fallback() exists
    });

    it("should maintain 0 balance invariant across entire loan lifecycle", async function () {
      const contractAddr = await contract.getAddress();
      expect(await ethers.provider.getBalance(contractAddr)).to.equal(0n);

      // Create loan
      await contract.connect(borrower).createLoan(ONE_ETH, TEN_PERCENT_BPS, THIRTY_DAYS);
      expect(await ethers.provider.getBalance(contractAddr)).to.equal(0n);

      // Fund loan
      await contract.connect(lender).fundLoan(1, { value: ONE_ETH });
      expect(await ethers.provider.getBalance(contractAddr)).to.equal(0n);

      // Partial repayment
      await contract.connect(borrower).repayLoan(1, { value: ethers.parseEther("0.5") });
      expect(await ethers.provider.getBalance(contractAddr)).to.equal(0n);

      // Final repayment
      const remaining = await contract.getRepaymentAmount(1);
      await contract.connect(borrower).repayLoan(1, { value: remaining });
      expect(await ethers.provider.getBalance(contractAddr)).to.equal(0n);
    });

    it("should reject ETH sent to non-payable functions", async function () {
      // createLoan is non-payable
      await expect(
        contract.connect(borrower).createLoan(ONE_ETH, TEN_PERCENT_BPS, THIRTY_DAYS, {
          value: ethers.parseEther("0.1"),
        })
      ).to.be.reverted;

      // cancelLoan is non-payable
      await contract.connect(borrower).createLoan(ONE_ETH, TEN_PERCENT_BPS, THIRTY_DAYS);
      await expect(
        contract.connect(borrower).cancelLoan(1, { value: ethers.parseEther("0.1") })
      ).to.be.reverted;
    });
  });

  // =========================================================================
  // 7. ARITHMETIC ACCURACY & ROUNDING
  // =========================================================================
  describe("Arithmetic Precision & Rounding Verification", function () {
    it("should correctly compute simple interest for arbitrary durations", async function () {
      // 1 ETH @ 10% APR for 1 year (365 days) -> exactly 1.1 ETH
      const oneYear = 365n * 86400n;
      const expectedOneYear = await contract.calculateRepaymentAmount(ONE_ETH, 1000n, oneYear);
      expect(expectedOneYear).to.equal(ethers.parseEther("1.1"));

      // 2 ETH @ 5% APR for 182.5 days (half year) -> 2.05 ETH
      const halfYear = 182n * 86400n + 43200n;
      const expectedHalfYear = await contract.calculateRepaymentAmount(
        ethers.parseEther("2.0"),
        500n,
        halfYear
      );
      expect(expectedHalfYear).to.equal(ethers.parseEther("2.05"));
    });

    it("should return remainingDue as 0 once COMPLETED", async function () {
      await contract.connect(borrower).createLoan(ONE_ETH, TEN_PERCENT_BPS, THIRTY_DAYS);
      await contract.connect(lender).fundLoan(1, { value: ONE_ETH });

      const fullAmount = await contract.getRepaymentAmount(1);
      await contract.connect(borrower).repayLoan(1, { value: fullAmount });

      expect(await contract.getRepaymentAmount(1)).to.equal(0n);
    });
  });
});
