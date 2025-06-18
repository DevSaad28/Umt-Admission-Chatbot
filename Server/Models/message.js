const mongoose = require("mongoose")

const chatSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    user_message: {
      type: String,
      required: true,
    },
    ai_response: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "General",
    },
    confidence: {
      type: Number,
      default: 0,
    },
    matched_question: {
      type: String,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for better query performance
chatSchema.index({ user_id: 1, timestamp: -1 })
chatSchema.index({ session_id: 1 })
chatSchema.index({ category: 1 })

module.exports = mongoose.model("Chat", chatSchema)
