const { ethers, network } = require("hardhat");
require("dotenv").config();

// Define roles
const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));
const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("Error: CONTRACT_ADDRESS not set in .env file");
    process.exit(1);
  }
  
  console.log(`Interacting with DevToken at ${contractAddress} on ${network.name}`);
  
  // Get the contract instance
  const DevToken = await ethers.getContractFactory("DevToken");
  const devToken = await DevToken.attach(contractAddress);
  
  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);
  
  // Display basic token information
  console.log("\nToken Information:");
  console.log("=================");
  console.log(`Name: ${await devToken.name()}`);
  console.log(`Symbol: ${await devToken.symbol()}`);
  console.log(`Total Supply: ${ethers.formatEther(await devToken.totalSupply())} DEV`);
  
  // Check roles
  console.log("\nRole Information:");
  console.log("================");
  console.log(`Account has DEFAULT_ADMIN_ROLE: ${await devToken.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)}`);
  console.log(`Account has MINTER_ROLE: ${await devToken.hasRole(MINTER_ROLE, deployer.address)}`);
  console.log(`Account has PAUSER_ROLE: ${await devToken.hasRole(PAUSER_ROLE, deployer.address)}`);
  console.log(`Account has ADMIN_ROLE: ${await devToken.hasRole(ADMIN_ROLE, deployer.address)}`);
  
  // Check balance
  const balance = await devToken.balanceOf(deployer.address);
  console.log(`\nAccount Balance: ${ethers.formatEther(balance)} DEV`);
  
  // Interactive menu
  await interactiveMenu(devToken, deployer);
}

async function interactiveMenu(devToken, deployer) {
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log("\nInteractive Menu:");
  console.log("================");
  console.log("1. Mint tokens");
  console.log("2. Transfer tokens");
  console.log("3. Create stake");
  console.log("4. Release stake");
  console.log("5. Create vesting schedule");
  console.log("6. Grant role");
  console.log("7. Pause/Unpause contract");
  console.log("8. Check account balance");
  console.log("9. Exit");
  
  readline.question("\nSelect an option (1-9): ", async (option) => {
    switch (option) {
      case "1":
        await mintTokens(devToken, deployer, readline);
        break;
      case "2":
        await transferTokens(devToken, deployer, readline);
        break;
      case "3":
        await createStake(devToken, deployer, readline);
        break;
      case "4":
        await releaseStake(devToken, deployer, readline);
        break;
      case "5":
        await createVestingSchedule(devToken, deployer, readline);
        break;
      case "6":
        await grantRole(devToken, deployer, readline);
        break;
      case "7":
        await togglePause(devToken, deployer, readline);
        break;
      case "8":
        await checkBalance(devToken, deployer, readline);
        break;
      case "9":
        console.log("Exiting...");
        readline.close();
        process.exit(0);
        break;
      default:
        console.log("Invalid option. Please try again.");
        await interactiveMenu(devToken, deployer, readline);
        break;
    }
  });
}

async function mintTokens(devToken, deployer, readline) {
  readline.question("Enter recipient address: ", (recipient) => {
    readline.question("Enter amount to mint: ", async (amount) => {
      readline.question("Enter reason for minting: ", async (reason) => {
        try {
          const tx = await devToken.mint(recipient, ethers.parseEther(amount), reason);
          await tx.wait();
          console.log(`Successfully minted ${amount} DEV tokens to ${recipient}`);
          console.log(`Transaction hash: ${tx.hash}`);
        } catch (error) {
          console.error("Error minting tokens:", error.message);
        }
        
        await continueOrExit(devToken, deployer, readline);
      });
    });
  });
}

async function transferTokens(devToken, deployer, readline) {
  readline.question("Enter recipient address: ", (recipient) => {
    readline.question("Enter amount to transfer: ", async (amount) => {
      try {
        const tx = await devToken.transfer(recipient, ethers.parseEther(amount));
        await tx.wait();
        console.log(`Successfully transferred ${amount} DEV tokens to ${recipient}`);
        console.log(`Transaction hash: ${tx.hash}`);
      } catch (error) {
        console.error("Error transferring tokens:", error.message);
      }
      
      await continueOrExit(devToken, deployer, readline);
    });
  });
}

async function createStake(devToken, deployer, readline) {
  readline.question("Enter amount to stake: ", async (amount) => {
    try {
      const tx = await devToken.createStake(ethers.parseEther(amount));
      await tx.wait();
      console.log(`Successfully staked ${amount} DEV tokens`);
      console.log(`Transaction hash: ${tx.hash}`);
    } catch (error) {
      console.error("Error staking tokens:", error.message);
    }
    
    await continueOrExit(devToken, deployer, readline);
  });
}

async function releaseStake(devToken, deployer, readline) {
  try {
    const stakedAmount = await devToken.getStakedAmount(deployer.address);
    console.log(`Current staked amount: ${ethers.formatEther(stakedAmount)} DEV`);
    
    if (stakedAmount > 0) {
      const tx = await devToken.releaseStake();
      await tx.wait();
      console.log(`Successfully released stake`);
      console.log(`Transaction hash: ${tx.hash}`);
    } else {
      console.log("No tokens staked");
    }
  } catch (error) {
    console.error("Error releasing stake:", error.message);
  }
  
  await continueOrExit(devToken, deployer, readline);
}

async function createVestingSchedule(devToken, deployer, readline) {
  readline.question("Enter beneficiary address: ", (beneficiary) => {
    readline.question("Enter amount to vest: ", (amount) => {
      readline.question("Enter duration in days: ", (durationDays) => {
        readline.question("Enter cliff period in days: ", async (cliffDays) => {
          try {
            const duration = parseInt(durationDays) * 24 * 60 * 60; // Convert days to seconds
            const cliff = parseInt(cliffDays) * 24 * 60 * 60; // Convert days to seconds
            
            const tx = await devToken.createVestingSchedule(
              beneficiary,
              ethers.parseEther(amount),
              duration,
              cliff
            );
            await tx.wait();
            
            console.log(`Successfully created vesting schedule for ${beneficiary}`);
            console.log(`Amount: ${amount} DEV`);
            console.log(`Duration: ${durationDays} days`);
            console.log(`Cliff: ${cliffDays} days`);
            console.log(`Transaction hash: ${tx.hash}`);
          } catch (error) {
            console.error("Error creating vesting schedule:", error.message);
          }
          
          await continueOrExit(devToken, deployer, readline);
        });
      });
    });
  });
}

async function grantRole(devToken, deployer, readline) {
  console.log("Available roles:");
  console.log("1. MINTER_ROLE");
  console.log("2. PAUSER_ROLE");
  console.log("3. ADMIN_ROLE");
  
  readline.question("Select role to grant (1-3): ", (roleOption) => {
    let role;
    let roleName;
    switch (roleOption) {
      case "1":
        role = MINTER_ROLE;
        roleName = "MINTER_ROLE";
        break;
      case "2":
        role = PAUSER_ROLE;
        roleName = "PAUSER_ROLE";
        break;
      case "3":
        role = ADMIN_ROLE;
        roleName = "ADMIN_ROLE";
        break;
      default:
        console.log("Invalid role option");
        grantRole(devToken, deployer, readline);
        return;
    }
    
    readline.question("Enter address to grant role to: ", async (address) => {
      try {
        const tx = await devToken.grantRole(role, address);
        await tx.wait();
        console.log(`Successfully granted ${roleName} to ${address}`);
        console.log(`Transaction hash: ${tx.hash}`);
      } catch (error) {
        console.error("Error granting role:", error.message);
      }
      
      await continueOrExit(devToken, deployer, readline);
    });
  });
}

async function togglePause(devToken, deployer, readline) {
  const isPaused = await devToken.paused();
  
  try {
    let tx;
    if (isPaused) {
      tx = await devToken.unpause();
      await tx.wait();
      console.log("Contract successfully unpaused");
    } else {
      tx = await devToken.pause();
      await tx.wait();
      console.log("Contract successfully paused");
    }
    console.log(`Transaction hash: ${tx.hash}`);
  } catch (error) {
    console.error("Error toggling pause state:", error.message);
  }
  
  await continueOrExit(devToken, deployer, readline);
}

async function checkBalance(devToken, deployer, readline) {
  readline.question("Enter address to check balance: ", async (address) => {
    try {
      const balance = await devToken.balanceOf(address);
      console.log(`Balance of ${address}: ${ethers.formatEther(balance)} DEV`);
      
      // Check if the address has any staked tokens
      const stakedAmount = await devToken.getStakedAmount(address);
      if (stakedAmount > 0) {
        console.log(`Staked amount: ${ethers.formatEther(stakedAmount)} DEV`);
      }
      
      // Check if the address has a vesting schedule
      const vestingSchedule = await devToken.getVestingSchedule(address);
      if (vestingSchedule[0] > 0) {
        console.log("\nVesting Schedule:");
        console.log(`Total Amount: ${ethers.formatEther(vestingSchedule[0])} DEV`);
        console.log(`Released Amount: ${ethers.formatEther(vestingSchedule[1])} DEV`);
        console.log(`Start Time: ${new Date(Number(vestingSchedule[2]) * 1000).toLocaleString()}`);
        console.log(`Duration: ${Number(vestingSchedule[3]) / (24 * 60 * 60)} days`);
        console.log(`Cliff: ${Number(vestingSchedule[4]) / (24 * 60 * 60)} days`);
      }
    } catch (error) {
      console.error("Error checking balance:", error.message);
    }
    
    await continueOrExit(devToken, deployer, readline);
  });
}

async function continueOrExit(devToken, deployer, readline) {
  readline.question("\nPress 'c' to continue or 'e' to exit: ", async (option) => {
    if (option.toLowerCase() === 'c') {
      await interactiveMenu(devToken, deployer, readline);
    } else {
      console.log("Exiting...");
      readline.close();
      process.exit(0);
    }
  });
}

// Execute the script
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
