const express = require("express");
const router = express.Router();

const userRouter = require("./userRoutes");
const chatRouter = require("./chatRoutes")


router.use("/api/user", userRouter);
router.use("/api/chat",chatRouter)
module.exports = router;
