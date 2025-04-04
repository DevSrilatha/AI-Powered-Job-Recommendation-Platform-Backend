const generateJobRecommendations = (user, jobs = []) => {
  if (!user || !user.skills) {
    console.error("Error: User or user skills are missing.");
    return [];
  }

  if (!Array.isArray(jobs)) {
    console.error("Error: jobs is not an array");
    return [];
  }

  return jobs
    .map((job) => {
      if (!Array.isArray(job.skillsRequired)) {
        console.warn(`Warning: Job ${job._id} has no skillsRequired array.`);
        return null; // Ignore jobs without skillsRequired
      }

      const matchScore = job.skillsRequired.filter((skill) =>
        user.skills.includes(skill)
      ).length;

      return matchScore > 0 ? { ...job.toObject(), matchScore } : null; // Convert to plain object
    })
    .filter((job) => job !== null) // Remove jobs with 0 matchScore
    .sort((a, b) => b.matchScore - a.matchScore); // Sort by highest match
};
module.exports = { generateJobRecommendations };