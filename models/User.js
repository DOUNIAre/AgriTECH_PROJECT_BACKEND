const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100,
    },
    role: {
      type: String,
      enum: ["farmer", "producer", "client"],
      default: "farmer",
      required: true,
    },
    location: {
      type: String,
      maxLength: 100,
    },
    preferredLanguage: {
      type: String,
      enum: ["ar", "fr", "en"],
      default: "fr",
    },
    bio: {
      type: String,
      maxLength: 500,
    },
    scorePoints: {
      type: Number,
      default: 0,
    },
    avatar: {
      type: String,
      maxLength: 200,
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.index({ skills: 1, location: 1 });

module.exports = mongoose.model("User", userSchema);