const { ethers } = require("hardhat");

async function main() {
  console.log("Testing TaskRewardManager contract...");

  // Get signers
  const [deployer, developer1, developer2] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Developer 1 address:", developer1.address);
  console.log("Developer 2 address:", developer2.address);

  // Get contract instances
  const DevToken = await ethers.getContractFactory("DevToken");
  const TaskRewardManager = await ethers.getContractFactory("TaskRewardManager");

  // Get deployed contracts
  let devToken, taskRewardManager;

  // Check if contract addresses are provided in .env
  if (process.env.DEV_TOKEN_ADDRESS && process.env.TASK_REWARD_MANAGER_ADDRESS) {
    console.log("Using existing contract addresses from .env");
    devToken = await DevToken.attach(process.env.DEV_TOKEN_ADDRESS);
    taskRewardManager = await TaskRewardManager.attach(process.env.TASK_REWARD_MANAGER_ADDRESS);
  } else {
    console.log("Deploying new contracts...");
    // Deploy DevToken
    devToken = await DevToken.deploy();
    console.log("DevToken deployed to:", devToken.address);

    // Deploy TaskRewardManager
    taskRewardManager = await TaskRewardManager.deploy(devToken.address);
    console.log("TaskRewardManager deployed to:", taskRewardManager.address);

    // Grant MINTER_ROLE to TaskRewardManager
    const MINTER_ROLE = await devToken.MINTER_ROLE();
    await devToken.grantRole(MINTER_ROLE, taskRewardManager.address);
    console.log("Granted MINTER_ROLE to TaskRewardManager");
  }

  // Check if TaskRewardManager has MINTER_ROLE
  const MINTER_ROLE = await devToken.MINTER_ROLE();
  const hasMinterRole = await devToken.hasRole(MINTER_ROLE, taskRewardManager.address);
  console.log("TaskRewardManager has MINTER_ROLE:", hasMinterRole);

  if (!hasMinterRole) {
    console.log("Granting MINTER_ROLE to TaskRewardManager...");
    await devToken.grantRole(MINTER_ROLE, taskRewardManager.address);
    console.log("MINTER_ROLE granted successfully");
  }

  // Display current configuration
  console.log("\nCurrent Configuration:");
  console.log("----------------------");
  
  // Display difficulty rewards
  console.log("\nDifficulty Rewards:");
  const easyReward = await taskRewardManager.difficultyRewards("easy");
  const mediumReward = await taskRewardManager.difficultyRewards("medium");
  const hardReward = await taskRewardManager.difficultyRewards("hard");
  console.log(`- Easy: ${ethers.formatEther(easyReward)} DEV tokens`);
  console.log(`- Medium: ${ethers.formatEther(mediumReward)} DEV tokens`);
  console.log(`- Hard: ${ethers.formatEther(hardReward)} DEV tokens`);

  // Display type multipliers
  console.log("\nType Multipliers:");
  const featureMultiplier = await taskRewardManager.typeMultipliers("feature");
  const bugMultiplier = await taskRewardManager.typeMultipliers("bug");
  const improvementMultiplier = await taskRewardManager.typeMultipliers("improvement");
  const documentationMultiplier = await taskRewardManager.typeMultipliers("documentation");
  const testMultiplier = await taskRewardManager.typeMultipliers("test");
  console.log(`- Feature: ${featureMultiplier / 100}x`);
  console.log(`- Bug: ${bugMultiplier / 100}x`);
  console.log(`- Improvement: ${improvementMultiplier / 100}x`);
  console.log(`- Documentation: ${documentationMultiplier / 100}x`);
  console.log(`- Test: ${testMultiplier / 100}x`);

  // Display status multipliers
  console.log("\nStatus Multipliers:");
  const doneMultiplier = await taskRewardManager.statusMultipliers("done");
  const verifiedMultiplier = await taskRewardManager.statusMultipliers("verified");
  console.log(`- Done: ${doneMultiplier / 100}x`);
  console.log(`- Verified: ${verifiedMultiplier / 100}x`);

  // Issue rewards for test tasks
  console.log("\nIssuing rewards for test tasks...");

  // Task 1: Easy feature task (done)
  const task1 = {
    id: "TASK-001",
    developer: developer1.address,
    difficulty: "easy",
    type: "feature",
    status: "done"
  };

  console.log(`\nTask 1: ${task1.difficulty} ${task1.type} (${task1.status})`);
  console.log(`- Developer: ${task1.developer}`);
  
  // Calculate expected reward
  const task1BaseReward = easyReward;
  const task1TypeMultiplier = featureMultiplier;
  const task1StatusMultiplier = doneMultiplier;
  const task1ExpectedReward = task1BaseReward.mul(task1TypeMultiplier).mul(task1StatusMultiplier).div(100).div(100);
  console.log(`- Expected reward: ${ethers.formatEther(task1ExpectedReward)} DEV tokens`);
  
  // Issue reward
  const task1Tx = await taskRewardManager.issueTaskReward(
    task1.id,
    task1.developer,
    task1.difficulty,
    task1.type,
    task1.status
  );
  await task1Tx.wait();
  console.log(`- Reward issued successfully (tx: ${task1Tx.hash})`);
  
  // Check developer balance
  const developer1Balance = await devToken.balanceOf(developer1.address);
  console.log(`- Developer 1 balance: ${ethers.formatEther(developer1Balance)} DEV tokens`);

  // Task 2: Hard bug task (verified)
  const task2 = {
    id: "TASK-002",
    developer: developer2.address,
    difficulty: "hard",
    type: "bug",
    status: "verified"
  };

  console.log(`\nTask 2: ${task2.difficulty} ${task2.type} (${task2.status})`);
  console.log(`- Developer: ${task2.developer}`);
  
  // Calculate expected reward
  const task2BaseReward = hardReward;
  const task2TypeMultiplier = bugMultiplier;
  const task2StatusMultiplier = verifiedMultiplier;
  const task2ExpectedReward = task2BaseReward.mul(task2TypeMultiplier).mul(task2StatusMultiplier).div(100).div(100);
  console.log(`- Expected reward: ${ethers.formatEther(task2ExpectedReward)} DEV tokens`);
  
  // Issue reward
  const task2Tx = await taskRewardManager.issueTaskReward(
    task2.id,
    task2.developer,
    task2.difficulty,
    task2.type,
    task2.status
  );
  await task2Tx.wait();
  console.log(`- Reward issued successfully (tx: ${task2Tx.hash})`);
  
  // Check developer balance
  const developer2Balance = await devToken.balanceOf(developer2.address);
  console.log(`- Developer 2 balance: ${ethers.formatEther(developer2Balance)} DEV tokens`);

  // Get task rewards count
  const rewardsCount = await taskRewardManager.getTaskRewardsCount();
  console.log(`\nTotal task rewards issued: ${rewardsCount}`);

  // Get developer rewards
  const developer1Rewards = await taskRewardManager.getDeveloperRewards(developer1.address, 10);
  const developer2Rewards = await taskRewardManager.getDeveloperRewards(developer2.address, 10);
  console.log(`Developer 1 rewards: ${developer1Rewards.length}`);
  console.log(`Developer 2 rewards: ${developer2Rewards.length}`);

  console.log("\nTaskRewardManager testing completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
