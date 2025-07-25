const express = require("express");
const router = express.Router();
const chatController = require("../Controllers/livechat.controller");
const auth = require("../Middleware/authMiddleware");

// ✅ Send message (user/admin)
router.post("/send", auth, chatController.sendMessage);

// ✅ Get conversation between current user and admin
router.get("/conversation", auth, chatController.getMessages);

// ✅ Admin: get all users who ever messaged admin
router.get("/users", auth, chatController.getChatUsers);

// ✅ Admin: get user-wise chat summaries (latest msg, time)
router.get("/admin/all", auth, chatController.getAllUserChats);

module.exports = router;
