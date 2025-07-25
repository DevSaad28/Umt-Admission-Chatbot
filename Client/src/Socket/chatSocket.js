import { io } from "socket.io-client";

// Backend Socket URL
export const chatSocket = io("http://localhost:5000", {
  transports: ["websocket"],
});
