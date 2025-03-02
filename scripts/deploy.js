const hre = require("hardhat");

async function main() {
  const { ethers } = hre;

  const FreelanceEscrow = await ethers.getContractFactory("FreelanceEscrow");

  // Deploy with custom gas settings
  const contract = await FreelanceEscrow.deploy({
    gasPrice: ethers.parseUnits("10", "gwei"), // Set gas price (e.g., 10 Gwei)
    gasLimit: 3000000, // Set gas limit
  });

  await contract.deploymentTransaction().wait(); // Ensure deployment is complete

  console.log("Contract deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error("Error deploying contract:", error);
  process.exit(1);
});
