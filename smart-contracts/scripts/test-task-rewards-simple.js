const { ethers } = require("hardhat");

async function main() {
  console.log("Testing TaskRewardManager contract...");

  // Contract addresses
  const devTokenAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const taskRewardManagerAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
  
  console.log("DevToken address:", devTokenAddress);
  console.log("TaskRewardManager address:", taskRewardManagerAddress);

  // Get signers
  const [deployer, developer1, developer2] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Developer 1 address:", developer1.address);
  console.log("Developer 2 address:", developer2.address);

  try {
    // Get contract factories
    const DevToken = await ethers.getContractFactory("DevToken");
    const TaskRewardManager = await ethers.getContractFactory("TaskRewardManager");
    
    // Connect to deployed contracts
    const devToken = DevToken.attach(devTokenAddress).connect(deployer);
    const taskRewardManager = TaskRewardManager.attach(taskRewardManagerAddress).connect(deployer);
    
    console.log("Connected to contracts successfully");
    
    // Grant MINTER_ROLE to TaskRewardManager if not already granted
    const MINTER_ROLE = await devToken.MINTER_ROLE();
    const hasMinterRole = await devToken.hasRole(MINTER_ROLE, taskRewardManagerAddress);
    console.log("TaskRewardManager has MINTER_ROLE:", hasMinterRole);
    
    if (!hasMinterRole) {
      console.log("Granting MINTER_ROLE to TaskRewardManager...");
      await devToken.grantRole(MINTER_ROLE, taskRewardManagerAddress);
      console.log("MINTER_ROLE granted successfully");
    }
    
    // Test issuing rewards
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
    
    console.log("\nTaskRewardManager testing completed successfully!");
  } catch (error) {
    console.error("Error testing TaskRewardManager:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
