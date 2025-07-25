const LiveChat = require("../Models/livechat.modal");
const User = require("../Models/userModel");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

const ADMIN_ID = "6883df2c8a712fda91389b6a"; // ✅ must be a valid ObjectId

// ✅ Send message (user → admin OR admin → user)
exports.sendMessage = asyncHandler(async (req, res) => {
  const sender = req.user._id.toString();
  const { message, receiver } = req.body;

  if (!message) {
    return res.status(400).json({ message: "Message content is required" });
  }

  let finalReceiver;

  if (sender === ADMIN_ID) {
    // Admin sending to user
    if (!receiver) return res.status(400).json({ message: "Receiver required" });
    finalReceiver = receiver;
  } else {
    // User sending to admin
    finalReceiver = ADMIN_ID;
  }

  const newMessage = await LiveChat.create({
    sender,
    receiver: finalReceiver,
    message,
  });

  res.status(201).json(newMessage);
});


// ✅ Get messages between current user and admin
exports.getMessages = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString(); // logged-in user (could be admin)
    const adminId = ADMIN_ID;
    const selectedUserId = req.query.userId; // passed by admin frontend

    let messages;

    if (currentUserId === adminId && selectedUserId) {
      // ✅ Admin fetching messages with a selected user
      messages = await LiveChat.find({
        $or: [
          { sender: adminId, receiver: selectedUserId },
          { sender: selectedUserId, receiver: adminId },
        ],
      }).sort({ createdAt: 1 });
    } else {
      // ✅ Normal user fetching their own conversation with admin
      messages = await LiveChat.find({
        $or: [
          { sender: currentUserId, receiver: adminId },
          { sender: adminId, receiver: currentUserId },
        ],
      }).sort({ createdAt: 1 });
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error("Get Messages Error:", error);
    res.status(500).json({ message: "Failed to retrieve messages" });
  }
};



// ✅ Admin: get all users who have messaged the admin
exports.getChatUsers = asyncHandler(async (req, res) => {
  const adminId = ADMIN_ID;

  if (req.user._id.toString() !== adminId) {
    return res.status(403).json({ message: "Access denied" });
  }

  const userIds = await LiveChat.distinct("sender", {
    receiver: new mongoose.Types.ObjectId(adminId),
  });

  const filtered = userIds.filter((id) => id.toString() !== adminId); // remove self

  const users = await User.find({ _id: { $in: filtered } }).select("name email");

  res.status(200).json(users);
});


// ✅ Admin: get summary of all chats (latest message per user)
exports.getAllUserChats = asyncHandler(async (req, res) => {
  const adminId = ADMIN_ID;

  if (req.user._id.toString() !== adminId) {
    return res.status(403).json({ message: "Access denied" });
  }

  const chats = await LiveChat.aggregate([
    {
      $match: {
        $or: [
          { sender: new mongoose.Types.ObjectId(adminId) },
          { receiver: new mongoose.Types.ObjectId(adminId) },
        ],
      },
    },
    {
      $project: {
        user: {
          $cond: {
            if: { $eq: ["$sender", new mongoose.Types.ObjectId(adminId)] },
            then: "$receiver",
            else: "$sender",
          },
        },
        message: 1,
        createdAt: 1,
      },
    },
    {
      $group: {
        _id: "$user",
        lastMessage: { $last: "$message" },
        lastUpdated: { $last: "$createdAt" },
      },
    },
    { $sort: { lastUpdated: -1 } },
  ]);

  res.status(200).json(chats);
});
