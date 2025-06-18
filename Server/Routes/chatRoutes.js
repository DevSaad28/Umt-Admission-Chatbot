const express = require("express");
const router = express.Router();
const chatController = require("../Controllers/chatController");

router.post("/send", chatController.sendChat);


// User-specific endpoints
router.get("/history/:user_id", chatController.getChatHistory);

module.exports = router;
