const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Job = require("../models/Job");
const User = require("../models/User");
const Application = require("../models/Application");
const { verifyToken, verifyRecruiter } = require("../middleware/authmiddleware");
const { upload } = require("../middleware/upload");
const sendEmailNotification = require("../utils/emailService");

// Apply for a job (Job Seeker)
router.post("/:id/apply", upload.single("resume"), verifyToken, async (req, res) => {
  try {
    const jobId = req.params.id;
    const applicantId = req.user.id;
    const coverLetter = req.body.coverLetter;
    const resume = req.file ? req.file.filename : null;

    if (!resume) {
      return res.status(400).json({ message: "Resume file is required." });
    }

    const existingApplication = await Application.findOne({ job: jobId, applicant: applicantId });
    if (existingApplication) {
      return res.status(400).json({ message: "You have already applied for this job." });
    }

    const newApplication = new Application({
      job: jobId,
      applicant: applicantId,
      resume,
      coverLetter,
      status: "pending",
    });

    await newApplication.save();

    // Fetch recruiter and applicant details
    const job = await Job.findById(jobId).populate("postedBy", "email name");
    const applicant = await User.findById(applicantId);

    if (job && job.postedBy && job.postedBy.email) {
      await sendEmailNotification(
        job.postedBy.email,
        "New Job Application Received",
        `Hello ${job.postedBy.name},

${applicant.name} has applied for the position of ${job.title} at ${job.company}.

Check your dashboard to review the application.`
      );
    }

    res.status(201).json({ message: "Application submitted successfully!", application: newApplication });
  } catch (error) {
    console.error("Error applying for job:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Fetch all applications for a specific job (Recruiters only)
router.get("/:jobId/fetchapplications", verifyToken, verifyRecruiter, async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view applications for this job" });
    }

    const applications = await Application.find({ job: jobId })
      .populate("applicant", "name email")
      .populate("job", "title company");

    res.status(200).json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
