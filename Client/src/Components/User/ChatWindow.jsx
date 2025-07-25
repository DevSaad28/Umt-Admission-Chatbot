import React, { useEffect, useState, useRef } from "react";
import { chatSocket } from "../../Socket/chatSocket";
import axios from "axios";
import {LiveChatSend,LiveConversation} from "../../url";
const ADMIN_ID = "908123097123"; // fixed admin ID

const ChatWindow = ({ user, token }) => {
  const [messages, setMessages] = useState([]); // ✅ always initialize as array
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  // 🔄 Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ✅ Load old messages
  const fetchMessages = async () => {
    try {
      const res = await axios.get(LiveConversation, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const fetchedMessages = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.messages)
        ? res.data.messages
        : [];

      setMessages(fetchedMessages);
      scrollToBottom();
    } catch (err) {
      console.error("Error fetching messages", err);
    }
  };

  // ✅ Setup socket connection
  useEffect(() => {
    if (!user?._id) return;

    chatSocket.emit("setup", user);

    chatSocket.on("connected", () => {
      console.log("Socket connected");
    });

    chatSocket.on("message received", (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
      scrollToBottom();
    });

    fetchMessages();

    return () => {
      chatSocket.off("connected");
      chatSocket.off("message received");
    };
  }, [user]);

  // ✅ Send message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const { data } = await axios.post(
        LiveChatSend,
        { message },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessages((prev) => [...prev, data]);
      setMessage("");
      scrollToBottom();

      // emit via socket
      chatSocket.emit("new message", {
        sender: user._id,
        receiver: ADMIN_ID,
        message,
      });
    } catch (err) {
      console.error("Message send error", err);
    }
  };

  return (
    <div style={styles.chatContainer}>
      <div style={styles.chatBox}>
        {Array.isArray(messages) &&
          messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                ...styles.message,
                alignSelf: msg.sender === user._id ? "flex-end" : "flex-start",
                background: msg.sender === user._id ? "#DCF8C6" : "#FFF",
              }}
            >
              {msg.message}
            </div>
          ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={styles.inputForm}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;

const styles = {
  chatContainer: {
    width: "100%",
    maxWidth: "600px",
    margin: "0 auto",
    border: "1px solid #ccc",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    height: "80vh",
  },
  chatBox: {
    flex: 1,
    padding: "10px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  message: {
    margin: "4px 0",
    padding: "8px 12px",
    borderRadius: "20px",
    maxWidth: "70%",
  },
  inputForm: {
    display: "flex",
    padding: "10px",
    borderTop: "1px solid #ccc",
  },
  input: {
    flex: 1,
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  button: {
    marginLeft: "10px",
    padding: "8px 12px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
  },
};
