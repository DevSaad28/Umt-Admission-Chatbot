const User = require("../Models/userModel");
const asyncHandler = require("express-async-handler");
const generateToken = require('../Config/generateToken')

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ 
      status: false, 
      message: "Please enter all the fields" 
    });
  }
  
  const userExist = await User.findOne({ email });
  if (userExist) {
    return res.status(400).json({ 
      status: false, 
      message: "User already exists" 
    });
  }
  
  const user = await User.create({
    name,
    email,
    password,
  });
  
  if (user) {
    res.status(201).json({
      status: true,
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } else {
    return res.status(400).json({ 
      status: false, 
      message: "Failed to create user" 
    });
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const user = await User.findOne({ email });
  
  if (user && (await user.matchPassword(password))) {
    res.json({
      status: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    return res.status(401).json({ 
      status: false, 
      message: "Invalid email or password" 
    });
  }
});

const getUser = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } }
        ]
      }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });

  res.send(users);
});


module.exports = { registerUser, loginUser, getUser };