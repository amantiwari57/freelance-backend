import { recommendJobs } from './jobRecommendations';

// Sample job data
const sampleJobs = [
  {
    jobTitle: 'Senior React Developer',
    description: 'Looking for an experienced React developer with strong TypeScript skills and experience in building scalable applications.',
    skills: ['react', 'typescript', 'frontend', 'redux'],
    timeline: 'medium' as const,
    totalTime: '3 months' as const,
    expertiseLevel: 'expert' as const,
    paymentType: 'fixed' as const,
    price: 5000
  },
  {
    jobTitle: 'Node.js Backend Developer',
    description: 'Seeking a Node.js developer to build RESTful APIs and work with MongoDB. Experience with Express.js required.',
    skills: ['node.js', 'express', 'mongodb', 'backend'],
    timeline: 'small' as const,
    totalTime: '1 month' as const,
    expertiseLevel: 'intermediate' as const,
    paymentType: 'hourly' as const,
    pricePerHour: { min: 25, max: 35 }
  },
  {
    jobTitle: 'Full Stack Developer',
    description: 'Full stack position requiring React and Node.js experience. Must be comfortable with both frontend and backend development.',
    skills: ['react', 'node.js', 'javascript', 'fullstack'],
    timeline: 'large' as const,
    totalTime: '6monthsormore' as const,
    expertiseLevel: 'expert' as const,
    paymentType: 'fixed' as const,
    price: 10000
  },
  {
    jobTitle: 'Junior Frontend Developer',
    description: 'Entry-level position for a frontend developer. Knowledge of HTML, CSS, and basic JavaScript required.',
    skills: ['html', 'css', 'javascript', 'frontend'],
    timeline: 'small' as const,
    totalTime: '1 month' as const,
    expertiseLevel: 'entry' as const,
    paymentType: 'hourly' as const,
    pricePerHour: { min: 15, max: 20 }
  }
];

// Test cases
const testCases = [
  {
    name: 'Expert React Developer',
    skills: ['react', 'typescript', 'redux', 'frontend'],
    expectedTopJob: 'Senior React Developer'
  },
  {
    name: 'Backend Developer',
    skills: ['node.js', 'express', 'mongodb'],
    expectedTopJob: 'Node.js Backend Developer'
  },
  {
    name: 'Full Stack Developer',
    skills: ['react', 'node.js', 'javascript', 'mongodb'],
    expectedTopJob: 'Full Stack Developer'
  },
  {
    name: 'Junior Developer',
    skills: ['html', 'css', 'javascript'],
    expectedTopJob: 'Junior Frontend Developer'
  }
];

async function runTests() {
  console.log('Starting job recommendation tests...\n');

  for (const testCase of testCases) {
    console.log(`Test Case: ${testCase.name}`);
    console.log('Skills:', testCase.skills);
    
    const recommendations = await recommendJobs(testCase.skills, sampleJobs, 3);
    
    console.log('\nTop 3 Recommended Jobs:');
    recommendations.forEach((job, index) => {
      console.log(`${index + 1}. ${job.jobTitle}`);
    });
    
    const topJob = recommendations[0]?.jobTitle;
    const passed = topJob === testCase.expectedTopJob;
    
    console.log(`\nTest ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`Expected top job: ${testCase.expectedTopJob}`);
    console.log(`Actual top job: ${topJob}`);
    console.log('\n' + '-'.repeat(50) + '\n');
  }
}

// Run the tests
runTests().catch(console.error); 