import { containerBootstrap } from '@nlpjs/core';
import { Nlp } from '@nlpjs/nlp';
import { LangEn } from '@nlpjs/lang-en-min';
import { z } from 'zod';
import jobSchema from './jobTypes';

type Job = z.infer<typeof jobSchema>;

/**
 * Recommends jobs based on a freelancer's skills using nlp.js.
 *
 * @param {string[]} freelancerSkills An array of the freelancer's skills.
 * @param {Job[]} availableJobs An array of job objects.
 * @param {number} [topN=3] The maximum number of job recommendations to return.
 * @returns {Promise<Job[]>} An array of recommended job objects, sorted by relevance (descending).
 */
export async function recommendJobs(
  freelancerSkills: string[],
  availableJobs: Job[],
  topN: number = 3
): Promise<Job[]> {
  // Initialize NLP container
  const container = await containerBootstrap();
  container.use(Nlp);
  container.use(LangEn);
  const nlp = container.get('nlp');
  nlp.settings.autoSave = false;
  nlp.addLanguage('en');

  // Train the NLP model with job descriptions
  for (const job of availableJobs) {
    nlp.addDocument('en', job.description, job.jobTitle);
  }
  await nlp.train();

  const recommendations: { job: Job; score: number }[] = [];

  for (const job of availableJobs) {
    let relevanceScore = 0;
    const processedResult = await nlp.process('en', freelancerSkills.join(', '));

    // Score based on entities found in freelancer skills matching job description
    if (processedResult.entities && processedResult.entities.length > 0) {
      for (const entity of processedResult.entities) {
        if (job.description.toLowerCase().includes(entity.option.toLowerCase())) {
          relevanceScore++;
        }
      }
    }

    // Check for direct keyword matches in title, description, and required skills
    for (const skill of freelancerSkills) {
      const skillLower = skill.toLowerCase();
      if (
        job.jobTitle.toLowerCase().includes(skillLower) ||
        job.description.toLowerCase().includes(skillLower) ||
        job.skills.some((jobSkill: string) => jobSkill.toLowerCase().includes(skillLower))
      ) {
        relevanceScore += 1;
      }
    }

    // Additional scoring based on expertise level match
    if (job.expertiseLevel === 'entry' && freelancerSkills.length <= 3) {
      relevanceScore += 2;
    } else if (job.expertiseLevel === 'intermediate' && freelancerSkills.length > 3 && freelancerSkills.length <= 6) {
      relevanceScore += 2;
    } else if (job.expertiseLevel === 'expert' && freelancerSkills.length > 6) {
      relevanceScore += 2;
    }

    if (relevanceScore > 0) {
      recommendations.push({ job, score: relevanceScore });
    }
  }

  // Sort recommendations by score (descending)
  recommendations.sort((a, b) => b.score - a.score);

  return recommendations.slice(0, topN).map(rec => rec.job);
} 