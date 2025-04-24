const { ethers, network } = require("hardhat");
require("dotenv").config();

/**
 * This script demonstrates how to test time-dependent features of the DevToken contract
 * on the Sepolia testnet or local blockchain.
 * 
 * It sets up a complete testing scenario for staking and vesting features.
 */
async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("Error: CONTRACT_ADDRESS not set in .env file");
    process.exit(1);
  }
  
  console.log(`Testing time-dependent features of DevToken at ${contractAddress} on ${network.name}`);
  
  // Get the contract instance
  const DevToken = await ethers.getContractFactory("DevToken");
  const devToken = await DevToken.attach(contractAddress);
  
  // Get signers (accounts)
  const [deployer, testUser1, testUser2] = await ethers.getSigners();
  
  console.log(`Using deployer account: ${deployer.address}`);
  console.log(`Using test account 1: ${testUser1.address}`);
  console.log(`Using test account 2: ${testUser2.address}`);
  
  // Display current state
  await displayState(devToken, deployer, testUser1, testUser2);
  
  // Test staking feature
  await testStaking(devToken, deployer, testUser1);
  
  // Test vesting feature
  await testVesting(devToken, deployer, testUser2);
  
  // Display final state
  console.log("\n=== Final State ===");
  await displayState(devToken, deployer, testUser1, testUser2);
  
  console.log("\nTesting completed. Check the transaction history on Etherscan for more details.");
  console.log(`https://${network.name}.etherscan.io/address/${contractAddress}`);
}

async function displayState(devToken, deployer, testUser1, testUser2) {
  console.log("\n=== Current State ===");
  
  // Token info
  console.log(`Token name: ${await devToken.name()}`);
  console.log(`Token symbol: ${await devToken.symbol()}`);
  console.log(`Total supply: ${ethers.formatEther(await devToken.totalSupply())} DEV`);
  
  // Account balances
  console.log(`\nDeployer balance: ${ethers.formatEther(await devToken.balanceOf(deployer.address))} DEV`);
  console.log(`Test User 1 balance: ${ethers.formatEther(await devToken.balanceOf(testUser1.address))} DEV`);
  console.log(`Test User 2 balance: ${ethers.formatEther(await devToken.balanceOf(testUser2.address))} DEV`);
  
  // Staking info
  console.log(`\nTest User 1 staked amount: ${ethers.formatEther(await devToken.getStakedAmount(testUser1.address))} DEV`);
  
  // Vesting info
  const vestingSchedule = await devToken.getVestingSchedule(testUser2.address);
  if (vestingSchedule[0] > 0) {
    console.log(`\nTest User 2 vesting schedule:`);
    console.log(`  Total amount: ${ethers.formatEther(vestingSchedule[0])} DEV`);
    console.log(`  Released amount: ${ethers.formatEther(vestingSchedule[1])} DEV`);
    console.log(`  Start time: ${new Date(Number(vestingSchedule[2]) * 1000).toLocaleString()}`);
    console.log(`  Duration: ${Number(vestingSchedule[3]) / (24 * 60 * 60)} days`);
    console.log(`  Cliff: ${Number(vestingSchedule[4]) / (24 * 60 * 60)} days`);
    
    // Calculate vesting progress
    const currentTime = Math.floor(Date.now() / 1000);
    const startTime = Number(vestingSchedule[2]);
    const duration = Number(vestingSchedule[3]);
    const cliff = Number(vestingSchedule[4]);
    const elapsedTime = currentTime - startTime;
    
    if (elapsedTime < cliff) {
      console.log(`  Status: In cliff period (${(cliff - elapsedTime) / (24 * 60 * 60)} days remaining)`);
    } else if (elapsedTime < duration) {
      const vestedPercentage = (elapsedTime / duration) * 100;
      console.log(`  Status: Vesting in progress (${vestedPercentage.toFixed(2)}% vested)`);
    } else {
      console.log(`  Status: Fully vested`);
    }
  } else {
    console.log(`\nTest User 2 has no vesting schedule`);
  }
}

async function testStaking(devToken, deployer, testUser) {
  console.log("\n=== Testing Staking Feature ===");
  
  try {
    // Check if the test user already has tokens
    let userBalance = await devToken.balanceOf(testUser.address);
    
    // If not, mint some tokens for testing
    if (userBalance == 0) {
      console.log(`Minting tokens for test user...`);
      const mintAmount = ethers.parseEther("100");
      const tx = await devToken.mint(testUser.address, mintAmount, "Testing staking feature");
      await tx.wait();
      console.log(`Minted ${ethers.formatEther(mintAmount)} DEV tokens to ${testUser.address}`);
      console.log(`Transaction hash: ${tx.hash}`);
      
      userBalance = await devToken.balanceOf(testUser.address);
    }
    
    // Check if user already has staked tokens
    const stakedAmount = await devToken.getStakedAmount(testUser.address);
    
    if (stakedAmount > 0) {
      console.log(`User already has ${ethers.formatEther(stakedAmount)} DEV tokens staked`);
      
      // Ask if user wants to release stake
      console.log(`\nTo release the stake, connect with the test user account and run:`);
      console.log(`npx hardhat run scripts/release-stake.js --network ${network.name}`);
    } else {
      // Create stake
      const stakeAmount = ethers.parseEther("50");
      
      // Check if user has enough balance
      if (userBalance < stakeAmount) {
        console.log(`Test user doesn't have enough tokens to stake. Has: ${ethers.formatEther(userBalance)} DEV, needs: ${ethers.formatEther(stakeAmount)} DEV`);
        return;
      }
      
      console.log(`Creating stake of ${ethers.formatEther(stakeAmount)} DEV tokens...`);
      console.log(`To create the stake, connect with the test user account and run:`);
      console.log(`npx hardhat run scripts/create-stake.js --network ${network.name}`);
      
      // Create a helper script for creating stake
      await createHelperScript("create-stake.js", stakeAmount);
      
      // Create a helper script for releasing stake
      await createHelperScript("release-stake.js");
    }
  } catch (error) {
    console.error("Error testing staking feature:", error.message);
  }
}

async function testVesting(devToken, deployer, testUser) {
  console.log("\n=== Testing Vesting Feature ===");
  
  try {
    // Check if the deployer has tokens
    const deployerBalance = await devToken.balanceOf(deployer.address);
    
    // If not, mint some tokens for testing
    if (deployerBalance == 0) {
      console.log(`Deployer has no tokens. Minting some for testing...`);
      const mintAmount = ethers.parseEther("1000");
      const tx = await devToken.mint(deployer.address, mintAmount, "Testing vesting feature");
      await tx.wait();
      console.log(`Minted ${ethers.formatEther(mintAmount)} DEV tokens to ${deployer.address}`);
      console.log(`Transaction hash: ${tx.hash}`);
    }
    
    // Check if user already has a vesting schedule
    const vestingSchedule = await devToken.getVestingSchedule(testUser.address);
    
    if (vestingSchedule[0] > 0) {
      console.log(`User already has a vesting schedule with ${ethers.formatEther(vestingSchedule[0])} DEV tokens`);
      
      // Ask if user wants to release vested tokens
      console.log(`\nTo release vested tokens, connect with the test user account and run:`);
      console.log(`npx hardhat run scripts/release-vested-tokens.js --network ${network.name}`);
    } else {
      // Create vesting schedule
      const vestAmount = ethers.parseEther("100");
      const duration = 30 * 24 * 60 * 60; // 30 days in seconds
      const cliff = 7 * 24 * 60 * 60; // 7 days cliff
      
      // Check if deployer has enough balance
      if (deployerBalance < vestAmount) {
        console.log(`Deployer doesn't have enough tokens for vesting. Has: ${ethers.formatEther(deployerBalance)} DEV, needs: ${ethers.formatEther(vestAmount)} DEV`);
        return;
      }
      
      console.log(`Creating vesting schedule of ${ethers.formatEther(vestAmount)} DEV tokens...`);
      console.log(`Duration: 30 days, Cliff: 7 days`);
      
      // Create vesting schedule
      const tx = await devToken.createVestingSchedule(testUser.address, vestAmount, duration, cliff);
      await tx.wait();
      console.log(`Created vesting schedule for ${testUser.address}`);
      console.log(`Transaction hash: ${tx.hash}`);
      
      // Create a helper script for releasing vested tokens
      await createHelperScript("release-vested-tokens.js");
      
      console.log(`\nVesting schedule created. The tokens will start vesting after the cliff period (7 days).`);
      console.log(`After the cliff period, connect with the test user account and run:`);
      console.log(`npx hardhat run scripts/release-vested-tokens.js --network ${network.name}`);
    }
  } catch (error) {
    console.error("Error testing vesting feature:", error.message);
  }
}

async function createHelperScript(filename, stakeAmount = null) {
  const fs = require("fs");
  const path = require("path");
  
  const scriptsDir = path.join(__dirname);
  const filePath = path.join(scriptsDir, filename);
  
  let content = "";
  
  if (filename === "create-stake.js") {
    content = `
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("Error: CONTRACT_ADDRESS not set in .env file");
    process.exit(1);
  }
  
  // Get the contract instance
  const DevToken = await ethers.getContractFactory("DevToken");
  const devToken = await DevToken.attach(contractAddress);
  
  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(\`Using account: \${signer.address}\`);
  
  // Create stake
  const stakeAmount = ethers.parseEther("${ethers.formatEther(stakeAmount)}");
  console.log(\`Creating stake of \${ethers.formatEther(stakeAmount)} DEV tokens...\`);
  
  const tx = await devToken.createStake(stakeAmount);
  await tx.wait();
  
  console.log(\`Successfully staked \${ethers.formatEther(stakeAmount)} DEV tokens\`);
  console.log(\`Transaction hash: \${tx.hash}\`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
`;
  } else if (filename === "release-stake.js") {
    content = `
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("Error: CONTRACT_ADDRESS not set in .env file");
    process.exit(1);
  }
  
  // Get the contract instance
  const DevToken = await ethers.getContractFactory("DevToken");
  const devToken = await DevToken.attach(contractAddress);
  
  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(\`Using account: \${signer.address}\`);
  
  // Get staked amount
  const stakedAmount = await devToken.getStakedAmount(signer.address);
  console.log(\`Current staked amount: \${ethers.formatEther(stakedAmount)} DEV\`);
  
  if (stakedAmount == 0) {
    console.log("No tokens staked. Nothing to release.");
    return;
  }
  
  // Release stake
  console.log(\`Releasing stake...\`);
  
  const tx = await devToken.releaseStake();
  await tx.wait();
  
  console.log(\`Successfully released stake\`);
  console.log(\`Transaction hash: \${tx.hash}\`);
  
  // Get new balance
  const balance = await devToken.balanceOf(signer.address);
  console.log(\`New balance: \${ethers.formatEther(balance)} DEV\`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
`;
  } else if (filename === "release-vested-tokens.js") {
    content = `
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("Error: CONTRACT_ADDRESS not set in .env file");
    process.exit(1);
  }
  
  // Get the contract instance
  const DevToken = await ethers.getContractFactory("DevToken");
  const devToken = await DevToken.attach(contractAddress);
  
  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(\`Using account: \${signer.address}\`);
  
  // Get vesting schedule
  const vestingSchedule = await devToken.getVestingSchedule(signer.address);
  
  if (vestingSchedule[0] == 0) {
    console.log("No vesting schedule found for this account.");
    return;
  }
  
  console.log(\`Vesting Schedule:\`);
  console.log(\`Total Amount: \${ethers.formatEther(vestingSchedule[0])} DEV\`);
  console.log(\`Released Amount: \${ethers.formatEther(vestingSchedule[1])} DEV\`);
  console.log(\`Start Time: \${new Date(Number(vestingSchedule[2]) * 1000).toLocaleString()}\`);
  console.log(\`Duration: \${Number(vestingSchedule[3]) / (24 * 60 * 60)} days\`);
  console.log(\`Cliff: \${Number(vestingSchedule[4]) / (24 * 60 * 60)} days\`);
  
  // Calculate vesting progress
  const currentTime = Math.floor(Date.now() / 1000);
  const startTime = Number(vestingSchedule[2]);
  const duration = Number(vestingSchedule[3]);
  const cliff = Number(vestingSchedule[4]);
  const elapsedTime = currentTime - startTime;
  
  if (elapsedTime < cliff) {
    console.log(\`Still in cliff period. Cannot release tokens yet.\`);
    console.log(\`Cliff ends in \${(cliff - elapsedTime) / (24 * 60 * 60)} days.\`);
    return;
  }
  
  // Release vested tokens
  console.log(\`Releasing vested tokens...\`);
  
  try {
    const tx = await devToken.releaseVestedTokens();
    await tx.wait();
    
    console.log(\`Successfully released vested tokens\`);
    console.log(\`Transaction hash: \${tx.hash}\`);
    
    // Get new balance
    const balance = await devToken.balanceOf(signer.address);
    console.log(\`New balance: \${ethers.formatEther(balance)} DEV\`);
  } catch (error) {
    console.error(\`Error releasing vested tokens: \${error.message}\`);
    
    if (error.message.includes("Cliff period not yet passed")) {
      console.log(\`The cliff period has not yet passed. Please wait until the cliff period ends.\`);
    } else if (error.message.includes("No tokens available for release")) {
      console.log(\`No tokens available for release. You may have already released all available tokens.\`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
`;
  }
  
  if (content) {
    fs.writeFileSync(filePath, content);
    console.log(`Created helper script: ${filename}`);
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
