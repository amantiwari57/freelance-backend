// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FreelanceEscrow {
    address public platform; // Platform address for collecting fees
    uint256 public platformFeePercentage = 2; // 2% platform fee

    struct Milestone {
        string description;
        uint256 amount;
        uint256 dueDate;
        bool isCompleted;
        bool isPaid;
    }

    struct Job {
        address client;
        address freelancer;
        uint256 totalAmount;
        uint256 escrowBalance;
        bool isCompleted;
        Milestone[] milestones;
    }

    mapping(uint256 => Job) public jobs; // Job ID -> Job details
    uint256 public jobCounter;

    event JobCreated(
        uint256 jobId,
        address client,
        address freelancer,
        uint256 totalAmount
    );
    event MilestoneCompleted(uint256 jobId, uint256 milestoneIndex);
    event PaymentReleased(
        uint256 jobId,
        uint256 milestoneIndex,
        uint256 amount
    );
    event JobCompleted(uint256 jobId);

    modifier onlyClient(uint256 jobId) {
        require(msg.sender == jobs[jobId].client, "Not the job client");
        _;
    }

    modifier onlyFreelancer(uint256 jobId) {
        require(
            msg.sender == jobs[jobId].freelancer,
            "Not the assigned freelancer"
        );
        _;
    }

    constructor() {
        platform = msg.sender; // Set platform address
    }

    function createJob(
        address _freelancer,
        uint256 _totalAmount,
        string[] memory _descriptions,
        uint256[] memory _amounts,
        uint256[] memory _dueDates
    ) external payable {
        require(msg.value == _totalAmount, "Must deposit the total amount");
        require(
            _descriptions.length == _amounts.length &&
                _amounts.length == _dueDates.length,
            "Invalid milestones"
        );

        jobCounter++;
        Job storage newJob = jobs[jobCounter];
        newJob.client = msg.sender;
        newJob.freelancer = _freelancer;
        newJob.totalAmount = _totalAmount;
        newJob.escrowBalance = _totalAmount;
        newJob.isCompleted = false;

        for (uint256 i = 0; i < _descriptions.length; i++) {
            newJob.milestones.push(
                Milestone({
                    description: _descriptions[i],
                    amount: _amounts[i],
                    dueDate: _dueDates[i],
                    isCompleted: false,
                    isPaid: false
                })
            );
        }

        emit JobCreated(jobCounter, msg.sender, _freelancer, _totalAmount);
    }

    function markMilestoneCompleted(
        uint256 jobId,
        uint256 milestoneIndex
    ) external onlyClient(jobId) {
        Job storage job = jobs[jobId];
        require(
            milestoneIndex < job.milestones.length,
            "Invalid milestone index"
        );
        require(
            !job.milestones[milestoneIndex].isCompleted,
            "Milestone already completed"
        );

        job.milestones[milestoneIndex].isCompleted = true;
        emit MilestoneCompleted(jobId, milestoneIndex);
    }

    function releaseMilestonePayment(
        uint256 jobId,
        uint256 milestoneIndex
    ) external onlyClient(jobId) {
        Job storage job = jobs[jobId];
        require(
            milestoneIndex < job.milestones.length,
            "Invalid milestone index"
        );
        require(
            job.milestones[milestoneIndex].isCompleted,
            "Milestone not marked complete"
        );
        require(
            !job.milestones[milestoneIndex].isPaid,
            "Milestone already paid"
        );

        uint256 payment = job.milestones[milestoneIndex].amount;
        uint256 platformFee = (payment * platformFeePercentage) / 100;
        uint256 freelancerAmount = payment - platformFee;

        require(job.escrowBalance >= payment, "Insufficient funds in escrow");
        job.escrowBalance -= payment;
        job.milestones[milestoneIndex].isPaid = true;

        payable(platform).transfer(platformFee);
        payable(job.freelancer).transfer(freelancerAmount);

        emit PaymentReleased(jobId, milestoneIndex, freelancerAmount);
    }

    function markJobCompleted(uint256 jobId) external onlyClient(jobId) {
        Job storage job = jobs[jobId];
        require(!job.isCompleted, "Job already completed");

        for (uint256 i = 0; i < job.milestones.length; i++) {
            require(job.milestones[i].isPaid, "All milestones must be paid");
        }

        job.isCompleted = true;
        emit JobCompleted(jobId);
    }

    function withdrawRemainingFunds(
        uint256 jobId
    ) external onlyFreelancer(jobId) {
        Job storage job = jobs[jobId];
        require(job.isCompleted, "Job must be marked completed first");
        require(job.escrowBalance > 0, "No funds left to withdraw");

        uint256 remainingAmount = job.escrowBalance;
        job.escrowBalance = 0;
        payable(job.freelancer).transfer(remainingAmount);
    }
}
