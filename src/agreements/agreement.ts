import { Hono } from "hono";
import { ethers } from "ethers";
import { verifyToken } from "../../helper/JwtHelpers/verifyToken";
import Job from "../../models/job/jobModel";
import { Agreement } from "../../models/agreement/agreementModel";


const agreementRouter = new Hono();

// // ✅ Ethereum Provider Setup
// const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
// const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
// const contractABI = require("../../contracts/AgreementContract.json"); // Ensure correct path
// const contractAddress = process.env.CONTRACT_ADDRESS;
// const contract = new ethers.Contract(contractAddress!, contractABI, wallet);

// ✅ Middleware: Authenticate User
const authenticate = async (c: any) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Authorization token is required" }, 401);
    }

    const token = authHeader.split(" ")[1];
    const tokenVerification = await verifyToken(token);
    if (tokenVerification.error) {
      return c.json({ error: tokenVerification.error }, 401);
    }

    return tokenVerification.decoded!.id; // ✅ Return user ID
  } catch (error) {
    return c.json({ error: "Authentication failed" }, 401);
  }
};

// 📌 **Client Creates Agreement (Only Job Owner)**
agreementRouter.post("/create/:jobId", async (c) => {
  const userId = await authenticate(c);
  if (typeof userId !== "string") return userId; // If auth fails, return error response

  const { jobId } = c.req.param();
  const { freelancerId, jobDescription, milestones, totalAmount } = await c.req.json();

  const job = await Job.findById(jobId);
  if (!job) return c.json({ error: "Job not found" }, 404);

  if (job.userId.toString() !== userId) {
    return c.json({ error: "Only the job owner can create an agreement" }, 403);
  }

  const existingAgreement = await Agreement.findOne({ jobId });
  if (existingAgreement) {
    return c.json({ error: "An agreement already exists for this job" }, 409);
  }

  const agreement = new Agreement({
    jobId,
    freelancerId,
    clientId: userId,
    jobDescription,
    milestones,
    totalAmount,
    status: "pending",
  });

  await agreement.save();
  return c.json({ message: "Agreement created successfully", agreement });
});

// 📌 **Freelancer Signs the Agreement**
agreementRouter.post("/sign/:agreementId", async (c) => {
  const userId = await authenticate(c);
  if (typeof userId !== "string") return userId;

  const { agreementId } = c.req.param();
  const agreement = await Agreement.findById(agreementId);

  if (!agreement) return c.json({ error: "Agreement not found" }, 404);
  if (agreement.freelancerId.toString() !== userId) {
    return c.json({ error: "Only the assigned freelancer can sign this agreement" }, 403);
  }

  agreement.status = "confirmed";
  await agreement.save();

  return c.json({ message: "Agreement signed successfully", agreement });
});

// 📌 **Get Agreement for a Specific Job**
agreementRouter.get("/:jobId", async (c) => {
  const userId = await authenticate(c);
  if (typeof userId !== "string") return userId;

  const { jobId } = c.req.param();
  const agreement = await Agreement.findOne({ jobId });

  if (!agreement) return c.json({ error: "No agreement found for this job" }, 404);

  return c.json({ agreement });
});

// 📌 **Deploy Smart Contract**
// agreementRouter.post("/deploy/:agreementId", async (c) => {
//   const userId = await authenticate(c);
//   if (typeof userId !== "string") return userId;

//   try {
//     const { agreementId } = c.req.param();
//     const agreement = await Agreement.findById(agreementId);

//     if (!agreement) return c.json({ error: "Agreement not found" }, 404);
//     if (agreement.clientId !== userId) {
//       return c.json({ error: "Unauthorized" }, 403);
//     }

//     // ✅ Deploy smart contract
//     const tx = await contract.createAgreement(
//       agreement.freelancerId,
//       agreement.milestones.map((m: any) => ({
//         description: m.description,
//         dueDate: Math.floor(new Date(m.dueDate).getTime() / 1000),
//         price: ethers.parseEther(m.price.toString()),
//       }))
//     );

//     const receipt = await tx.wait();
//     agreement.contractAddress = receipt.contractAddress;
//     agreement.status = "deployed";
//     await agreement.save();

//     return c.json({ message: "Smart contract deployed", contractAddress: receipt.contractAddress }, 201);
//   } catch (error: any) {
//     return c.json({ error: error.message }, 500);
//   }
// });

export default agreementRouter;
