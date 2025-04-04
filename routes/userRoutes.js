const express = require("express");
const User = require("../models/User");
const { verifyToken } = require("../middleware/authmiddleware");
const  {upload} = require("../middleware/upload"); // Import multer middleware

const router = express.Router();

// Create user profile (if not exists)
router.post("/profile", verifyToken, async (req, res) => {
  try {
    const { skills, resume, preferences, company } = req.body;
    console.log("Received profile data:", req.body);

    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if profile already exists
    if (user.skills.length || user.resume || Object.keys(user.preferences || {}).length) {
      return res.status(400).json({ message: "Profile already exists" });
    }

    // Update user fields
    user.skills = skills || [];
    user.resume = resume || "";
    user.preferences = preferences || {};
    if (user.role === "recruiter") user.company = company || "";

    await user.save();
    console.log("Updated user profile:", user);
    res.status(201).json({ message: "Profile created successfully", user });
  } catch (error) {
    console.error("Error creating profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get user profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    console.log("Fetched user profile:", user);
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update user profile
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name, skills, resume, preferences, company } = req.body;
    console.log("Received profile update data:", req.body);

    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update only provided fields
    if (name) user.name = name;
    if (skills) user.skills = skills;
    if (resume) user.resume = resume;
    if (preferences) user.preferences = preferences;
    if (user.role === "recruiter" && company) user.company = company;

    await user.save();
    console.log("Updated user profile:", user);
    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Resume Upload Route
router.post("/upload-resume", verifyToken, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const resumePath = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user.id, { resume: resumePath }, { new: true });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Resume uploaded successfully", resume: resumePath });
  } catch (error) {
    res.status(500).json({ message: "Resume upload failed", error: error.message });
  }
});

// Get Resume by User ID (For Recruiters)
router.get("/resume/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user || !user.resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    res.json({ resume: `http://localhost:5000${user.resume}` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;


