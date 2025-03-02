import { ethers } from "ethers";
import contractData from "../../artifacts/contracts/contract.sol/FreelanceEscrow.json" ;

// ✅ Extract only the `abi` property

// Extract the ABI
const contractABI = contractData.abi;

// Load environment variables
const RPC_URL = process.env.RPC_URL; // Sepolia RPC URL
const PRIVATE_KEY = process.env.PRIVATE_KEY; // Your wallet's private key
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS; // Deployed contract address

if (!RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
  throw new Error("Missing environment variables!");
}

// Set up provider and wallet
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Load the contract
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

async function testCreateJob() {
  try {
    console.log("🔗 Connecting to contract at:", CONTRACT_ADDRESS);

    // Define job details
    const freelancerAddress = "0xFreelancerAddressHere"; // Replace with the freelancer's address
    const totalAmount = ethers.parseEther("0.05"); // Total job amount in ETH (e.g., 0.05 ETH)
    const descriptions = ["Complete first milestone", "Complete second milestone"]; // Milestone descriptions
    const amounts = [ethers.parseEther("0.02"), ethers.parseEther("0.03")]; // Milestone amounts in ETH
    const dueDates = [
      Math.floor(Date.now() / 1000) + 86400, // Due in 1 day (Unix timestamp)
      Math.floor(Date.now() / 1000) + 172800, // Due in 2 days (Unix timestamp)
    ];

    // Call the createJob function
    const tx = await contract.createJob(
      freelancerAddress,
      totalAmount,
      descriptions,
      amounts,
      dueDates,
      { value: totalAmount } // Send ETH with the transaction
    );

    console.log("📨 Transaction sent! Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("✅ Job created! Transaction hash:", receipt.hash);
  } catch (error:any) {
    console.error("❌ Error creating job:", error.message);
  }
}



export default testCreateJob;
