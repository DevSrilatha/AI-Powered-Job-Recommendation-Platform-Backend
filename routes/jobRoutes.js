const express = require("express");
const Job = require("../models/Job");
const User = require("../models/User");  // Required for recommendations
const { verifyToken, verifyRecruiter } = require("../middleware/authmiddleware");
const { generateJobRecommendations } = require("../utils/jobRecommendation");
const mongoose = require("mongoose");

const router = express.Router();

// Create a new job (Only recruiters)
router.post("/create", verifyToken, verifyRecruiter, async (req, res) => {
  try {
    const { title, description, location, category, salary, jobType, company, skillsRequired } = req.body;

    // Validate required fields
    if (!title || !description || !location || !category || !salary || !jobType || !company || !skillsRequired) {
      return res.status(400).json({ message: "All fields including skillsRequired are required" });
    }

    if (!Array.isArray(skillsRequired) || skillsRequired.length === 0) {
      return res.status(400).json({ message: "skillsRequired must be a non-empty array" });
    }

    // Check if a job with the same title and company already exists
    const existingJob = await Job.findOne({ title, company });
    if (existingJob) {
      return res.status(400).json({ message: "A job with the same title and company already exists!" });
    }

    // Create a new job
    const newJob = new Job({
      title,
      description,
      location,
      category,
      salary,
      jobType,
      company,
      skillsRequired,
      postedBy: req.user.id, // User ID from token
    });

    await newJob.save();
    res.status(201).json({ message: "Job created successfully!", job: newJob });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});







// Fetch all jobs
router.get("/all", async (req, res) => {
  console.log("Fetching all jobs...");
  console.log("Filters:", req.query);  // Log filters if any
  try {
    const jobs = await Job.find().populate("postedBy", "name");
    res.status(200).json({ jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



// Fetch recruiter’s jobs
router.get("/recruiter", verifyToken, verifyRecruiter, async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.id });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a job (Recruiters only)
router.delete("/:id", verifyToken, verifyRecruiter, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Debug: Log the IDs to verify matching
    console.log("Job postedBy:", job.postedBy.toString());
    console.log("Logged in user ID:", req.user.id);

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this job" });
    }

    await job.deleteOne();
    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    console.error("Error deleting job:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get AI-powered job recommendations
router.get("/recommendations", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.skills.length) {
      return res.status(400).json({ message: "Update your skills to get recommendations." });
    }

    const jobs = await Job.find(); // Fetch all job listings
    console.log("Fetched Jobs:", jobs);
    const recommendations = await generateJobRecommendations(user, jobs);

    res.status(200).json({ recommendations });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// Fetch a single job by ID
router.get("/:id", async (req, res) => {
  try {
    // Validate if req.params.id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid Job ID" });
    }

    const job = await Job.findById(req.params.id).populate("postedBy", "name");
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);
  } catch (err) {
    console.error("Error fetching job:", err);
    res.status(500).json({ message: "Server error" });
  }
});



// Update a job (Recruiters only)

// Update a job (Recruiters only)
router.put("/:id", verifyToken, verifyRecruiter, async (req, res) => {
  try {
    const { title, description, location, category, salary, jobType, company } = req.body;

    // Check if required fields are missing
    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    // Find the job by ID
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Ensure the recruiter owns this job
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to update this job" });
    }

    // Update job fields
    job.title = title || job.title;
    job.description = description || job.description;
    job.location = location || job.location;
    job.category = category || job.category;
    job.salary = salary || job.salary;
    job.jobType = jobType || job.jobType;
    job.company = company || job.company;

    // Save the updated job
    await job.save();

    res.json({ message: "Job updated successfully", job });
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


module.exports = router;
