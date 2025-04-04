const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log("Decoded user:", req.user);
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const verifyRecruiter = (req, res, next) => {
  try {
    if (req.user.role !== "recruiter") {
      console.log("User data:", req.user);
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { verifyToken, verifyRecruiter };
