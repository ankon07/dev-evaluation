const { run, network } = require("hardhat");
require("dotenv").config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("Error: CONTRACT_ADDRESS not set in .env file");
    process.exit(1);
  }
  
  console.log(`Verifying DevToken contract on ${network.name}...`);
  console.log(`Contract address: ${contractAddress}`);
  
  try {
    // Run the verification
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
      contract: "contracts/DevToken.sol:DevToken"
    });
    
    console.log("Contract verification successful!");
  } catch (error) {
    if (error.message.includes("already verified")) {
      console.log("Contract is already verified!");
    } else {
      console.error("Error during verification:", error);
      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
