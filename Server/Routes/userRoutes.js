
const express = require("express");
const userRouter = express.Router();
const userController = require("../Controllers/userController");
const auth = require("../Middleware/authMiddleware")


userRouter.post(
  "/login",
  userController.loginUser
);
userRouter.post(
  "/register",
  userController.registerUser
);
userRouter.get(
  "/",
  auth,
  userController.getUser 
);

// productRouter.get("/", productController.getAllProducts);



module.exports = userRouter;
