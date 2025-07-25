const LiveChat = require("../Models/livechat.modal")

const ADMIN_ID = "6883df2c8a712fda91389b6a"; // Fixed admin ID

// User or Admin sends message to each other
exports.sendMessage = async (req, res) => {
  try {
    const sender = req.user._id.toString(); // current user
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message content is required" });
    }

    // Determine receiver
    const receiver =
      sender === ADMIN_ID ? req.body.receiver : ADMIN_ID;

    if (!receiver) {
      return res.status(400).json({ message: "Receiver is required for admin messages" });
    }

    const newMessage = await LiveChat.create({
      sender,
      receiver,
      message,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};



exports.getMessages = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const adminId = ADMIN_ID;

    const messages = await LiveChat.find({
      $or: [
        { sender: userId, receiver: adminId },
        { sender: adminId, receiver: userId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Get Messages Error:", error);
    res.status(500).json({ message: "Failed to retrieve messages" });
  }
};




exports.getAllUserChats = async (req, res) => {
  try {
    const adminId = ADMIN_ID;

    if (req.user._id.toString() !== adminId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Find unique user IDs who chatted with admin
    const chats = await LiveChat.aggregate([
      {
        $match: {
          $or: [{ sender: adminId }, { receiver: adminId }],
        },
      },
      {
        $project: {
          user: {
            $cond: {
              if: { $eq: ["$sender", adminId] },
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
  } catch (err) {
    console.error("Admin chat list error", err);
    res.status(500).json({ message: "Failed to fetch user chats" });
  }
};
