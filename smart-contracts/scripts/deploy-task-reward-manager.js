const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying TaskRewardManager to localhost network...");

  // Get the DevToken contract address
  const devTokenAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  console.log("Using DevToken at:", devTokenAddress);

  // Deploy TaskRewardManager
  const TaskRewardManager = await ethers.getContractFactory("TaskRewardManager");
  const deployTx = await TaskRewardManager.getDeployTransaction(devTokenAddress);
  const signer = (await ethers.getSigners())[0];
  const tx = await signer.sendTransaction(deployTx);
  const receipt = await tx.wait();
  
  // Get the contract address from the receipt
  const taskRewardManagerAddress = receipt.contractAddress;
  console.log("TaskRewardManager deployed to:", taskRewardManagerAddress);
  
  // Attach to the deployed contract
  const taskRewardManager = await TaskRewardManager.attach(taskRewardManagerAddress);

  // Get the DevToken contract
  const DevToken = await ethers.getContractFactory("DevToken");
  const devToken = await DevToken.attach(devTokenAddress);

  // Grant MINTER_ROLE to TaskRewardManager
  const MINTER_ROLE = await devToken.MINTER_ROLE();
  await devToken.grantRole(MINTER_ROLE, taskRewardManager.address);
  console.log("Granted MINTER_ROLE to TaskRewardManager");

  console.log("\nDeployment Information:");
  console.log("=======================");
  console.log("Network: localhost");
  console.log("DevToken Address:", devTokenAddress);
  console.log("TaskRewardManager Address:", taskRewardManager.address);

  // Verify that TaskRewardManager has MINTER_ROLE
  const hasMinterRole = await devToken.hasRole(MINTER_ROLE, taskRewardManager.address);
  console.log("TaskRewardManager has MINTER_ROLE:", hasMinterRole);

  console.log("\nTaskRewardManager deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
