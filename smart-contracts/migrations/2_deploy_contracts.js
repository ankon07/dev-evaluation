const DevToken = artifacts.require("DevToken");
const TaskRewardManager = artifacts.require("TaskRewardManager");

module.exports = async function (deployer, network, accounts) {
  // Deploy the DevToken contract
  await deployer.deploy(DevToken);
  const devToken = await DevToken.deployed();
  
  // Deploy the TaskRewardManager contract with the DevToken address
  await deployer.deploy(TaskRewardManager, devToken.address);
  
  // Grant MINTER_ROLE to the TaskRewardManager contract
  const taskRewardManager = await TaskRewardManager.deployed();
  const MINTER_ROLE = await devToken.MINTER_ROLE();
  await devToken.grantRole(MINTER_ROLE, taskRewardManager.address);
  
  console.log("DevToken deployed at:", devToken.address);
  console.log("TaskRewardManager deployed at:", taskRewardManager.address);
};
