const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BlockLoan - Initial Contract Suite", function () {
  let blockLoan;
  let deployer, borrower, lender;

  beforeEach(async function () {
    [deployer, borrower, lender] = await ethers.getSigners();
    const BlockLoan = await ethers.getContractFactory("BlockLoan");
    blockLoan = await BlockLoan.deploy();
    await blockLoan.waitForDeployment();
  });

  it("should deploy contract successfully with 0 initial loans", async function () {
    expect(await blockLoan.getTotalLoans()).to.equal(0);
  });

  it("should accurately calculate repayment amount with interest", async function () {
    // 1 ETH (10^18 wei), 1000 bps (10%), 365 days duration
    const principal = ethers.parseEther("1.0");
    const interestRateBps = 1000n; // 10%
    const duration = 365n * 24n * 60n * 60n; // 1 year

    const repaymentAmount = await blockLoan.calculateRepaymentAmount(
      principal,
      interestRateBps,
      duration
    );

    // Expected = 1.0 ETH principal + 0.1 ETH interest = 1.1 ETH
    expect(repaymentAmount).to.equal(ethers.parseEther("1.1"));
  });
});
