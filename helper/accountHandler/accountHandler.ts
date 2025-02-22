import { ProposalAccount } from "../../models/proposals/account/accountModel";

export const deductProposal = async (userId: string): Promise<boolean | string> => {
    const proposalAccount = await ProposalAccount.findOne({ userId });
  
    if (!proposalAccount) {
      return "Proposal account not found";
    }
  
    if (proposalAccount.proposalCount <= 0) {
      return "You have run out of proposal credits";
    }
  
    // Deduct one proposal count
    proposalAccount.proposalCount -= 1;
    await proposalAccount.save();
  
    return true; // Successfully deducted
  };

  export const reassignProposal = async (userId: string): Promise<boolean | string> => {
    const proposalAccount = await ProposalAccount.findOne({ userId });
  
    if (!proposalAccount) {
      return "Proposal account not found";
    }
  
    // Increment the proposal count
    proposalAccount.proposalCount += 1;
    await proposalAccount.save();
  
    return true; // Successfully reassigned
  };