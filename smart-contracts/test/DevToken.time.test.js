const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("DevToken Time-Dependent Features", function () {
  // Fixture to deploy the contract and get accounts
  async function deployDevTokenFixture() {
    // Get signers
    const [owner, user1, user2, user3] = await ethers.getSigners();
    
    // Deploy the contract
    const DevToken = await ethers.getContractFactory("DevToken");
    const devToken = await DevToken.deploy();
    
    return { devToken, owner, user1, user2, user3 };
  }

  describe("Staking with Time Advancement", function () {
    it("Should calculate correct rewards based on staking duration", async function () {
      const { devToken, owner, user1 } = await loadFixture(deployDevTokenFixture);
      
      // Mint tokens to user
      const mintAmount = ethers.parseEther("1000");
      await devToken.mint(user1.address, mintAmount, "Initial allocation");
      
      // Stake tokens
      const stakeAmount = ethers.parseEther("100");
      await devToken.connect(user1).createStake(stakeAmount);
      
      // Get current timestamp
      const startTime = await time.latest();
      
      // Advance time by 180 days (approximately half a year)
      await time.increaseTo(startTime + 180 * 24 * 60 * 60);
      
      // Get balance before releasing stake
      const balanceBefore = await devToken.balanceOf(user1.address);
      
      // Release stake
      await devToken.connect(user1).releaseStake();
      
      // Get balance after releasing stake
      const balanceAfter = await devToken.balanceOf(user1.address);
      
      // Calculate expected reward (approximately 2.5% for half a year with 5% APY)
      const expectedReward = stakeAmount * BigInt(5) * BigInt(180) / (BigInt(365) * BigInt(100));
      
      // Check that the user received their staked amount plus rewards
      expect(balanceAfter - balanceBefore).to.be.closeTo(
        stakeAmount + expectedReward,
        ethers.parseEther("0.1") // Allow for small rounding differences
      );
    });

    it("Should allow multiple staking periods with correct rewards", async function () {
      const { devToken, owner, user1 } = await loadFixture(deployDevTokenFixture);
      
      // Mint tokens to user
      const mintAmount = ethers.parseEther("1000");
      await devToken.mint(user1.address, mintAmount, "Initial allocation");
      
      // First staking period
      const stakeAmount1 = ethers.parseEther("100");
      await devToken.connect(user1).createStake(stakeAmount1);
      
      // Advance time by 90 days
      await time.increase(90 * 24 * 60 * 60);
      
      // Release first stake
      await devToken.connect(user1).releaseStake();
      
      // Second staking period with more tokens
      const stakeAmount2 = ethers.parseEther("200");
      await devToken.connect(user1).createStake(stakeAmount2);
      
      // Advance time by 180 days
      await time.increase(180 * 24 * 60 * 60);
      
      // Get balance before releasing second stake
      const balanceBefore = await devToken.balanceOf(user1.address);
      
      // Release second stake
      await devToken.connect(user1).releaseStake();
      
      // Get balance after releasing second stake
      const balanceAfter = await devToken.balanceOf(user1.address);
      
      // Check that the user received their staked amount plus rewards
      expect(balanceAfter - balanceBefore).to.be.gt(stakeAmount2);
    });
  });

  describe("Vesting with Time Advancement", function () {
    it("Should not allow token release before cliff period", async function () {
      const { devToken, owner, user1 } = await loadFixture(deployDevTokenFixture);
      
      // Mint tokens to owner for vesting
      const mintAmount = ethers.parseEther("1000");
      await devToken.mint(owner.address, mintAmount, "Tokens for vesting");
      
      // Create vesting schedule
      const vestAmount = ethers.parseEther("100");
      const duration = 365 * 24 * 60 * 60; // 1 year in seconds
      const cliff = 90 * 24 * 60 * 60; // 90 days cliff
      
      await devToken.createVestingSchedule(user1.address, vestAmount, duration, cliff);
      
      // Advance time by 60 days (before cliff)
      await time.increase(60 * 24 * 60 * 60);
      
      // Try to release vested tokens
      await expect(
        devToken.connect(user1).releaseVestedTokens()
      ).to.be.revertedWith("Cliff period not yet passed");
    });

    it("Should release tokens proportionally after cliff period", async function () {
      const { devToken, owner, user1 } = await loadFixture(deployDevTokenFixture);
      
      // Mint tokens to owner for vesting
      const mintAmount = ethers.parseEther("1000");
      await devToken.mint(owner.address, mintAmount, "Tokens for vesting");
      
      // Create vesting schedule
      const vestAmount = ethers.parseEther("100");
      const duration = 365 * 24 * 60 * 60; // 1 year in seconds
      const cliff = 90 * 24 * 60 * 60; // 90 days cliff
      
      await devToken.createVestingSchedule(user1.address, vestAmount, duration, cliff);
      
      // Advance time by 180 days (after cliff, halfway through vesting)
      await time.increase(180 * 24 * 60 * 60);
      
      // Release vested tokens
      await devToken.connect(user1).releaseVestedTokens();
      
      // Check user balance (should be approximately 50% of vested amount)
      const balance = await devToken.balanceOf(user1.address);
      const expectedAmount = vestAmount * BigInt(180) / BigInt(365);
      
      expect(balance).to.be.closeTo(
        expectedAmount,
        ethers.parseEther("1") // Allow for some rounding differences
      );
    });

    it("Should release all tokens after vesting period", async function () {
      const { devToken, owner, user1 } = await loadFixture(deployDevTokenFixture);
      
      // Mint tokens to owner for vesting
      const mintAmount = ethers.parseEther("1000");
      await devToken.mint(owner.address, mintAmount, "Tokens for vesting");
      
      // Create vesting schedule
      const vestAmount = ethers.parseEther("100");
      const duration = 365 * 24 * 60 * 60; // 1 year in seconds
      const cliff = 90 * 24 * 60 * 60; // 90 days cliff
      
      await devToken.createVestingSchedule(user1.address, vestAmount, duration, cliff);
      
      // Advance time by 400 days (after vesting period)
      await time.increase(400 * 24 * 60 * 60);
      
      // Release vested tokens
      await devToken.connect(user1).releaseVestedTokens();
      
      // Check user balance (should be 100% of vested amount)
      const balance = await devToken.balanceOf(user1.address);
      
      expect(balance).to.equal(vestAmount);
    });

    it("Should allow multiple releases with correct amounts", async function () {
      const { devToken, owner, user1 } = await loadFixture(deployDevTokenFixture);
      
      // Mint tokens to owner for vesting
      const mintAmount = ethers.parseEther("1000");
      await devToken.mint(owner.address, mintAmount, "Tokens for vesting");
      
      // Create vesting schedule
      const vestAmount = ethers.parseEther("100");
      const duration = 365 * 24 * 60 * 60; // 1 year in seconds
      const cliff = 90 * 24 * 60 * 60; // 90 days cliff
      
      await devToken.createVestingSchedule(user1.address, vestAmount, duration, cliff);
      
      // Advance time by 120 days (after cliff, ~1/3 through vesting)
      await time.increase(120 * 24 * 60 * 60);
      
      // First release
      await devToken.connect(user1).releaseVestedTokens();
      
      // Check first release amount
      const balanceAfterFirstRelease = await devToken.balanceOf(user1.address);
      const expectedFirstRelease = vestAmount * BigInt(120) / BigInt(365);
      
      expect(balanceAfterFirstRelease).to.be.closeTo(
        expectedFirstRelease,
        ethers.parseEther("1")
      );
      
      // Advance time by another 120 days (~2/3 through vesting)
      await time.increase(120 * 24 * 60 * 60);
      
      // Second release
      await devToken.connect(user1).releaseVestedTokens();
      
      // Check total released amount
      const balanceAfterSecondRelease = await devToken.balanceOf(user1.address);
      const expectedTotalRelease = vestAmount * BigInt(240) / BigInt(365);
      
      expect(balanceAfterSecondRelease).to.be.closeTo(
        expectedTotalRelease,
        ethers.parseEther("1")
      );
      
      // Advance time to end of vesting period
      await time.increase(150 * 24 * 60 * 60);
      
      // Final release
      await devToken.connect(user1).releaseVestedTokens();
      
      // Check final balance (should be 100% of vested amount)
      const finalBalance = await devToken.balanceOf(user1.address);
      
      expect(finalBalance).to.equal(vestAmount);
    });
  });
});
