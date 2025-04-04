const express = require("express");
const { verifyToken } = require("../middleware/authmiddleware");
const Message = require("../models/Message");

const router = express.Router();

// Send a new message
router.post("/send", verifyToken, async (req, res) => {
  try {
    const { receiver, message } = req.body;
    const sender = req.user.id;

    const newMessage = new Message({ sender, receiver, message });
    await newMessage.save();

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get chat history
router.get("/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: currentUser, receiver: userId },
        { sender: userId, receiver: currentUser },
      ],
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
