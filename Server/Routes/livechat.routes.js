const express = require("express");
const router = express.Router();
const chatController = require("../Controllers/livechat.controller");
const auth = require("../Middleware/authMiddleware");

// User/admin sends message
router.post("/send", auth, chatController.sendMessage);

// Get messages between current user and admin
router.get("/conversation", auth, chatController.getMessages);

// Admin: Get all users that have chatted
router.get("/admin/all", auth, chatController.getAllUserChats);

module.exports = router;
