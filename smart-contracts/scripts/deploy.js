const { ethers, network } = require("hardhat");

async function main() {
  console.log(`Deploying DevToken to ${network.name} network...`);

  // Get the contract factory
  const DevToken = await ethers.getContractFactory("DevToken");

  // Deploy the contract
  const devToken = await DevToken.deploy();
  await devToken.waitForDeployment();

  // Get the deployed contract address
  const devTokenAddress = await devToken.getAddress();
  console.log(`DevToken deployed to: ${devTokenAddress}`);

  // Log additional information for verification
  console.log("\nDeployment Information:");
  console.log("=======================");
  console.log(`Network: ${network.name}`);
  console.log(`Contract Address: ${devTokenAddress}`);
  console.log(`Block Number: ${await ethers.provider.getBlockNumber()}`);
  console.log(`Gas Price: ${(await ethers.provider.getFeeData()).gasPrice}`);
  
  // Wait for a few block confirmations to ensure the contract is properly deployed
  console.log("\nWaiting for block confirmations...");
  
  // For Sepolia and other testnets, we wait for 6 confirmations
  if (network.name !== "localhost" && network.name !== "hardhat") {
    console.log("Waiting for 6 confirmations...");
    await devToken.deploymentTransaction().wait(6);
    console.log("Confirmed!");
    
    // Verification instructions
    console.log("\nVerification Instructions:");
    console.log("=========================");
    console.log("Run the following command to verify the contract on Etherscan:");
    console.log(`npx hardhat verify --network ${network.name} ${devTokenAddress}`);
  }
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
