const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("DevToken Contract", function () {
  // Define roles
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;

  // Fixture to deploy the contract and get accounts
  async function deployDevTokenFixture() {
    // Get signers
    const [owner, user1, user2, user3] = await ethers.getSigners();
    
    // Deploy the contract
    const DevToken = await ethers.getContractFactory("DevToken");
    const devToken = await DevToken.deploy();
    
    return { devToken, owner, user1, user2, user3 };
  }

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      const { devToken } = await loadFixture(deployDevTokenFixture);
      
      expect(await devToken.name()).to.equal("Developer Evaluation Token");
      expect(await devToken.symbol()).to.equal("DEV");
    });

    it("Should assign roles to the deployer", async function () {
      const { devToken, owner } = await loadFixture(deployDevTokenFixture);
      
      expect(await devToken.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await devToken.hasRole(MINTER_ROLE, owner.address)).to.be.true;
      expect(await devToken.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
      expect(await devToken.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint tokens", async function () {
      const { devToken, owner, user1 } = await loadFixture(deployDevTokenFixture);
      
      const mintAmount = ethers.parseEther("100");
      await devToken.mint(user1.address, mintAmount, "Initial allocation");
      
      expect(await devToken.balanceOf(user1.address)).to.equal(mintAmount);
    });

    it("Should emit TokensMinted event when minting", async function () {
      const { devToken, owner, user1 } = await loadFixture(deployDevTokenFixture);
      
      const mintAmount = ethers.parseEther("100");
      const reason = "Initial allocation";
      
      await expect(devToken.mint(user1.address, mintAmount, reason))
        .to.emit(devToken, "TokensMinted")
        .withArgs(user1.address, mintAmount, reason);
    });

    it("Should revert when non-minter tries to mint", async function () {
      const { devToken, user1, user2 } = await loadFixture(deployDevTokenFixture);
      
      const mintAmount = ethers.parseEther("100");
      
      await expect(
        devToken.connect(user1).mint(user2.address, mintAmount, "Unauthorized mint")
      ).to.be.revertedWith("AccessControl: account " + user1.address.toLowerCase() + " is missing role " + MINTER_ROLE);
    });
  });

  describe("Burning", function () {
    it("Should allow minter to burn tokens", async function () {
      const { devToken, owner, user1 } = await loadFixture(deployDevTokenFixture);
      
      // First mint some tokens
      const mintAmount = ethers.parseEther("100");
      await devToken.mint(user1.address, mintAmount, "Initial allocation");
      
      // Then burn some of them
      const burnAmount = ethers.parseEther("30");
      await devToken.burnTokens(user1.address, burnAmount, "Penalty");
      
      expect(await devToken.balanceOf(user1.address)).to.equal(mintAmount - burnAmount);
    });

    it("Should emit TokensBurned event when burning", async function () {
      const { devToken, owner, user1 } = await loadFixture(deployDevTokenFixture);
      
      // First mint some tokens
      const mintAmount = ethers.parseEther("100");
      await devToken.mint(user1.address, mintAmount, "Initial allocation");
      
      // Then burn some of them
      const burnAmount = ethers.parseEther("30");
      const reason = "Penalty";
      
      await expect(devToken.burnTokens(user1.address, burnAmount, reason))
        .to.emit(devToken, "TokensBurned")
        .withArgs(user1.address, burnAmount, reason);
    });

    it("Should revert when non-minter tries to burn", async function () {
      const { devToken, owner, user1, user2 } = await loadFixture(deployDevTokenFixture);
      
      // First mint some tokens
      const mintAmount = ethers.parseEther("100");
      await devToken.mint(user1.address, mintAmount, "Initial allocation");
      
      // Try to burn as non-minter
      const burnAmount = ethers.parseEther("30");
      
      await expect(
        devToken.connect(user2).burnTokens(user1.address, burnAmount, "Unauthorized burn")
      ).to.be.revertedWith("AccessControl: account " + user2.address.toLowerCase() + " is missing role " + MINTER_ROLE);
    });
  });

  describe("Pausing", function () {
    it("Should allow pauser to pause and unpause", async function () {
      const { devToken, owner } = await loadFixture(deployDevTokenFixture);
      
      // Pause
      await devToken.pause();
      expect(await devToken.paused()).to.be.true;
      
      // Unpause
      await devToken.unpause();
      expect(await devToken.paused()).to.be.false;
    });

    it("Should prevent minting when paused", async function () {
      const { devToken, owner, user1 } = await loadFixture(deployDevTokenFixture);
      
      // Pause
      await devToken.pause();
      
      // Try to mint
      const mintAmount = ethers.parseEther("100");
      
      await expect(
        devToken.mint(user1.address, mintAmount, "Mint while paused")
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should revert when non-pauser tries to pause", async function () {
      const { devToken, user1 } = await loadFixture(deployDevTokenFixture);
      
      await expect(
        devToken.connect(user1).pause()
      ).to.be.revertedWith("AccessControl: account " + user1.address.toLowerCase() + " is missing role " + PAUSER_ROLE);
    });
  });

  describe("Staking", function () {
    it("Should allow users to stake tokens", async function () {
      const { devToken, owner, user1 } = await loadFixture(deployDevTokenFixture);
      
      // Mint tokens to user
      const mintAmount = ethers.parseEther("100");
      await devToken.mint(user1.address, mintAmount, "Initial allocation");
      
      // Stake tokens
      const stakeAmount = ethers.parseEther("50");
      await devToken.connect(user1).createStake(stakeAmount);
      
      // Check stake amount
      expect(await devToken.getStakedAmount(user1.address)).to.equal(stakeAmount);
      
      // Check user balance
      expect(await devToken.balanceOf(user1.address)).to.equal(mintAmount - stakeAmount);
      
      // Check contract balance
      expect(await devToken.balanceOf(await devToken.getAddress())).to.equal(stakeAmount);
    });

    it("Should emit StakeCreated event when staking", async function () {
      const { devToken, owner, user1 } = await loadFixture(deployDevTokenFixture);
      
      // Mint tokens to user
      const mintAmount = ethers.parseEther("100");
      await devToken.mint(user1.address, mintAmount, "Initial allocation");
      
      // Stake tokens
      const stakeAmount = ethers.parseEther("50");
      
      await expect(devToken.connect(user1).createStake(stakeAmount))
        .to.emit(devToken, "StakeCreated")
        .withArgs(user1.address, stakeAmount);
    });

    it("Should allow users to release stake with rewards", async function () {
      const { devToken, owner, user1 } = await loadFixture(deployDevTokenFixture);
      
      // Mint tokens to user
      const mintAmount = ethers.parseEther("100");
      await devToken.mint(user1.address, mintAmount, "Initial allocation");
      
      // Stake tokens
      const stakeAmount = ethers.parseEther("50");
      await devToken.connect(user1).createStake(stakeAmount);
      
      // Simulate time passing (1 year) for APY calculation
      // Note: In a real test, you would use time manipulation functions
      
      // Release stake
      await devToken.connect(user1).releaseStake();
      
      // Check stake amount (should be 0 after release)
      expect(await devToken.getStakedAmount(user1.address)).to.equal(0);
      
      // Check user balance (should be original amount plus rewards)
      expect(await devToken.balanceOf(user1.address)).to.be.at.least(mintAmount);
    });

    it("Should prevent transferring staked tokens", async function () {
      const { devToken, owner, user1, user2 } = await loadFixture(deployDevTokenFixture);
      
      // Mint tokens to user
      const mintAmount = ethers.parseEther("100");
      await devToken.mint(user1.address, mintAmount, "Initial allocation");
      
      // Stake tokens
      const stakeAmount = ethers.parseEther("50");
      await devToken.connect(user1).createStake(stakeAmount);
      
      // Try to transfer more than available (non-staked) tokens
      const transferAmount = ethers.parseEther("60");
      
      await expect(
        devToken.connect(user1).transfer(user2.address, transferAmount)
      ).to.be.revertedWith("Cannot transfer staked tokens");
    });
  });

  describe("Vesting", function () {
    it("Should allow admin to create vesting schedule", async function () {
      const { devToken, owner, user1 } = await loadFixture(deployDevTokenFixture);
      
      // Mint tokens to owner for vesting
      const mintAmount = ethers.parseEther("1000");
      await devToken.mint(owner.address, mintAmount, "Tokens for vesting");
      
      // Create vesting schedule
      const vestAmount = ethers.parseEther("100");
      const duration = 365 * 24 * 60 * 60; // 1 year in seconds
      const cliff = 90 * 24 * 60 * 60; // 90 days cliff
      
      await devToken.createVestingSchedule(user1.address, vestAmount, duration, cliff);
      
      // Check vesting schedule
      const schedule = await devToken.getVestingSchedule(user1.address);
      expect(schedule[0]).to.equal(vestAmount); // totalAmount
      expect(schedule[1]).to.equal(0); // releasedAmount
      expect(schedule[3]).to.equal(duration); // duration
      expect(schedule[4]).to.equal(cliff); // cliff
    });

    it("Should emit VestingScheduleCreated event", async function () {
      const { devToken, owner, user1 } = await loadFixture(deployDevTokenFixture);
      
      // Mint tokens to owner for vesting
      const mintAmount = ethers.parseEther("1000");
      await devToken.mint(owner.address, mintAmount, "Tokens for vesting");
      
      // Create vesting schedule
      const vestAmount = ethers.parseEther("100");
      const duration = 365 * 24 * 60 * 60; // 1 year in seconds
      const cliff = 90 * 24 * 60 * 60; // 90 days cliff
      
      await expect(devToken.createVestingSchedule(user1.address, vestAmount, duration, cliff))
        .to.emit(devToken, "VestingScheduleCreated")
        .withArgs(user1.address, vestAmount, duration, cliff);
    });

    it("Should revert when non-admin tries to create vesting schedule", async function () {
      const { devToken, owner, user1, user2 } = await loadFixture(deployDevTokenFixture);
      
      // Mint tokens to user1
      const mintAmount = ethers.parseEther("1000");
      await devToken.mint(user1.address, mintAmount, "Tokens for vesting");
      
      // Try to create vesting schedule as non-admin
      const vestAmount = ethers.parseEther("100");
      const duration = 365 * 24 * 60 * 60; // 1 year in seconds
      const cliff = 90 * 24 * 60 * 60; // 90 days cliff
      
      await expect(
        devToken.connect(user1).createVestingSchedule(user2.address, vestAmount, duration, cliff)
      ).to.be.revertedWith("AccessControl: account " + user1.address.toLowerCase() + " is missing role " + ADMIN_ROLE);
    });
  });
});
