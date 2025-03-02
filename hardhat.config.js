require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // Load environment variables

module.exports = {
  paths: {
    sources: "./contracts",
  },
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: process.env.RPC_URL, // Use the environment variable
      accounts: [process.env.PRIVATE_KEY], // Use the environment variable
    },
  },
};