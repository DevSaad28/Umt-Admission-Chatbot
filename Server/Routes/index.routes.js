const express = require("express");
const router = express.Router();

const userRouter = require("./userRoutes");
const chatRouter = require("./chatRoutes")
const liveChatRoutes = require("./livechat.routes");


router.use("/api/user", userRouter);
router.use("/api/chat",chatRouter);
router.use("/api/livechat", liveChatRoutes);

module.exports = router;
