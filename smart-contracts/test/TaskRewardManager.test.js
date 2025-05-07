const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TaskRewardManager", function () {
  let devToken;
  let taskRewardManager;
  let owner;
  let developer1;
  let developer2;
  let rewardManager;

  beforeEach(async function () {
    // Get signers
    [owner, developer1, developer2, rewardManager] = await ethers.getSigners();

    // Deploy DevToken
    const DevToken = await ethers.getContractFactory("DevToken");
    devToken = await DevToken.deploy();

    // Deploy TaskRewardManager
    const TaskRewardManager = await ethers.getContractFactory("TaskRewardManager");
    taskRewardManager = await TaskRewardManager.deploy(devToken.address);

    // Grant MINTER_ROLE to TaskRewardManager
    const MINTER_ROLE = await devToken.MINTER_ROLE();
    await devToken.grantRole(MINTER_ROLE, taskRewardManager.address);

    // Grant REWARD_MANAGER_ROLE to rewardManager
    const REWARD_MANAGER_ROLE = await taskRewardManager.REWARD_MANAGER_ROLE();
    await taskRewardManager.grantRole(REWARD_MANAGER_ROLE, rewardManager.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const DEFAULT_ADMIN_ROLE = await taskRewardManager.DEFAULT_ADMIN_ROLE();
      expect(await taskRewardManager.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(true);
    });

    it("Should set the right DevToken address", async function () {
      expect(await taskRewardManager.devToken()).to.equal(devToken.address);
    });

    it("Should set default difficulty rewards", async function () {
      expect(await taskRewardManager.difficultyRewards("easy")).to.equal(ethers.parseEther("0.5"));
      expect(await taskRewardManager.difficultyRewards("medium")).to.equal(ethers.parseEther("1"));
      expect(await taskRewardManager.difficultyRewards("hard")).to.equal(ethers.parseEther("2"));
    });

    it("Should set default type multipliers", async function () {
      expect(await taskRewardManager.typeMultipliers("feature")).to.equal(120);
      expect(await taskRewardManager.typeMultipliers("bug")).to.equal(110);
      expect(await taskRewardManager.typeMultipliers("improvement")).to.equal(100);
      expect(await taskRewardManager.typeMultipliers("documentation")).to.equal(80);
      expect(await taskRewardManager.typeMultipliers("test")).to.equal(90);
    });

    it("Should set default status multipliers", async function () {
      expect(await taskRewardManager.statusMultipliers("done")).to.equal(100);
      expect(await taskRewardManager.statusMultipliers("verified")).to.equal(125);
    });
  });

  describe("Reward Configuration", function () {
    it("Should allow admin to set difficulty rewards", async function () {
      await taskRewardManager.setDifficultyReward("very-hard", ethers.parseEther("3"));
      expect(await taskRewardManager.difficultyRewards("very-hard")).to.equal(ethers.parseEther("3"));
    });

    it("Should allow admin to set type multipliers", async function () {
      await taskRewardManager.setTypeMultiplier("security", 150);
      expect(await taskRewardManager.typeMultipliers("security")).to.equal(150);
    });

    it("Should allow admin to set status multipliers", async function () {
      await taskRewardManager.setStatusMultiplier("reviewed", 110);
      expect(await taskRewardManager.statusMultipliers("reviewed")).to.equal(110);
    });

    it("Should not allow non-admin to set difficulty rewards", async function () {
      await expect(
        taskRewardManager.connect(developer1).setDifficultyReward("very-hard", ethers.parseEther("3"))
      ).to.be.reverted;
    });

    it("Should not allow non-admin to set type multipliers", async function () {
      await expect(
        taskRewardManager.connect(developer1).setTypeMultiplier("security", 150)
      ).to.be.reverted;
    });

    it("Should not allow non-admin to set status multipliers", async function () {
      await expect(
        taskRewardManager.connect(developer1).setStatusMultiplier("reviewed", 110)
      ).to.be.reverted;
    });
  });

  describe("Task Rewards", function () {
    it("Should issue rewards correctly for easy tasks", async function () {
      const taskId = "TASK-001";
      const difficulty = "easy";
      const taskType = "feature";
      const status = "done";

      // Calculate expected reward
      const baseReward = ethers.parseEther("0.5"); // easy
      const typeMultiplier = 120; // feature = 1.2x
      const statusMultiplier = 100; // done = 1.0x
      const expectedReward = baseReward.mul(typeMultiplier).mul(statusMultiplier).div(100).div(100);

      // Issue reward
      await taskRewardManager.connect(rewardManager).issueTaskReward(
        taskId,
        developer1.address,
        difficulty,
        taskType,
        status
      );

      // Check developer balance
      expect(await devToken.balanceOf(developer1.address)).to.equal(expectedReward);
    });

    it("Should issue rewards correctly for hard tasks with verified status", async function () {
      const taskId = "TASK-002";
      const difficulty = "hard";
      const taskType = "bug";
      const status = "verified";

      // Calculate expected reward
      const baseReward = ethers.parseEther("2"); // hard
      const typeMultiplier = 110; // bug = 1.1x
      const statusMultiplier = 125; // verified = 1.25x
      const expectedReward = baseReward.mul(typeMultiplier).mul(statusMultiplier).div(100).div(100);

      // Issue reward
      await taskRewardManager.connect(rewardManager).issueTaskReward(
        taskId,
        developer1.address,
        difficulty,
        taskType,
        status
      );

      // Check developer balance
      expect(await devToken.balanceOf(developer1.address)).to.equal(expectedReward);
    });

    it("Should record task rewards in history", async function () {
      const taskId = "TASK-003";
      
      // Issue reward
      await taskRewardManager.connect(rewardManager).issueTaskReward(
        taskId,
        developer1.address,
        "medium",
        "improvement",
        "done"
      );

      // Check task rewards count
      expect(await taskRewardManager.getTaskRewardsCount()).to.equal(1);

      // Get developer rewards
      const rewardIndices = await taskRewardManager.getDeveloperRewards(developer1.address, 10);
      expect(rewardIndices.length).to.equal(1);

      // Check reward details
      const reward = await taskRewardManager.taskRewards(rewardIndices[0]);
      expect(reward.taskId).to.equal(taskId);
      expect(reward.developer).to.equal(developer1.address);
      expect(reward.difficulty).to.equal("medium");
      expect(reward.taskType).to.equal("improvement");
      expect(reward.status).to.equal("done");
    });

    it("Should not allow non-reward-manager to issue rewards", async function () {
      await expect(
        taskRewardManager.connect(developer1).issueTaskReward(
          "TASK-004",
          developer2.address,
          "medium",
          "feature",
          "done"
        )
      ).to.be.reverted;
    });

    it("Should fail with invalid parameters", async function () {
      // Invalid developer address
      await expect(
        taskRewardManager.connect(rewardManager).issueTaskReward(
          "TASK-005",
          ethers.ZeroAddress,
          "medium",
          "feature",
          "done"
        )
      ).to.be.revertedWith("Invalid developer address");

      // Invalid difficulty
      await expect(
        taskRewardManager.connect(rewardManager).issueTaskReward(
          "TASK-006",
          developer1.address,
          "invalid-difficulty",
          "feature",
          "done"
        )
      ).to.be.revertedWith("Invalid difficulty level");

      // Invalid task type
      await expect(
        taskRewardManager.connect(rewardManager).issueTaskReward(
          "TASK-007",
          developer1.address,
          "medium",
          "invalid-type",
          "done"
        )
      ).to.be.revertedWith("Invalid task type");

      // Invalid status
      await expect(
        taskRewardManager.connect(rewardManager).issueTaskReward(
          "TASK-008",
          developer1.address,
          "medium",
          "feature",
          "invalid-status"
        )
      ).to.be.revertedWith("Invalid status");
    });
  });

  describe("Pause/Unpause", function () {
    it("Should allow admin to pause and unpause", async function () {
      // Pause
      await taskRewardManager.pause();
      expect(await taskRewardManager.paused()).to.equal(true);

      // Try to issue reward while paused
      await expect(
        taskRewardManager.connect(rewardManager).issueTaskReward(
          "TASK-009",
          developer1.address,
          "medium",
          "feature",
          "done"
        )
      ).to.be.reverted;

      // Unpause
      await taskRewardManager.unpause();
      expect(await taskRewardManager.paused()).to.equal(false);

      // Issue reward after unpausing
      await taskRewardManager.connect(rewardManager).issueTaskReward(
        "TASK-010",
        developer1.address,
        "medium",
        "feature",
        "done"
      );

      // Check developer balance
      expect(await devToken.balanceOf(developer1.address)).to.be.gt(0);
    });

    it("Should not allow non-admin to pause or unpause", async function () {
      await expect(taskRewardManager.connect(developer1).pause()).to.be.reverted;
      await expect(taskRewardManager.connect(developer1).unpause()).to.be.reverted;
    });
  });

  describe("DevToken Update", function () {
    it("Should allow admin to update DevToken address", async function () {
      // Deploy a new DevToken
      const NewDevToken = await ethers.getContractFactory("DevToken");
      const newDevToken = await NewDevToken.deploy();

      // Update DevToken address
      await taskRewardManager.updateDevTokenAddress(newDevToken.address);
      expect(await taskRewardManager.devToken()).to.equal(newDevToken.address);
    });

    it("Should not allow non-admin to update DevToken address", async function () {
      const NewDevToken = await ethers.getContractFactory("DevToken");
      const newDevToken = await NewDevToken.deploy();

      await expect(
        taskRewardManager.connect(developer1).updateDevTokenAddress(newDevToken.address)
      ).to.be.reverted;
    });

    it("Should not allow update to zero address", async function () {
      await expect(
        taskRewardManager.updateDevTokenAddress(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid token address");
    });
  });
});
