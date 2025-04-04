const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");



const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["jobseeker", "recruiter"], required: true },
  skills: { type: [String], default: [] },  // <== Ensure it's an array of strings
  resume: { type: String },
  preferences: { type: Object },
  company: { type: String }
});
// Hash password before saving user
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model("User", UserSchema);
