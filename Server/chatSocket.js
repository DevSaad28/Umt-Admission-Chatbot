const { Server } = require("socket.io");

const initChatSocket = (server) => {
  const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
      origin: ["http://localhost:3000", "http://localhost:5173"], // your frontend URLs
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ New socket connected:", socket.id);

    // User or admin joins their private room
    socket.on("setup", (userData) => {
      socket.join(userData._id); // join room with user ID
      console.log("User joined room:", userData._id);
      socket.emit("connected");
    });

    // Optional: Join a specific chat room (1-on-1)
    socket.on("join chat", (chatRoomId) => {
      socket.join(chatRoomId);
      console.log("Joined chat room:", chatRoomId);
    });

    // Typing indicator
    socket.on("typing", (room) => socket.to(room).emit("typing"));
    socket.on("stop typing", (room) => socket.to(room).emit("stop typing"));

    // When a new message is sent
    socket.on("new message", (message) => {
      const chatUsers = [message.sender, message.receiver];
      chatUsers.forEach((userId) => {
        if (userId !== message.sender) {
          socket.to(userId).emit("message received", message);
        }
      });
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });
};

module.exports = initChatSocket;
