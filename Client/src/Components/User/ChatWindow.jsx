import { useEffect, useState, useRef } from "react";
import { chatSocket } from "../../Socket/chatSocket";
import axios from "axios";
import { LiveChatSend, LiveConversation } from "../../url";

const ADMIN_ID = "908123097123"; // fixed admin ID

const ChatWindow = ({ user, token }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(LiveConversation, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fetchedMessages = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.messages)
        ? res.data.messages
        : [];

      setMessages(fetchedMessages);
    } catch (err) {
      console.error("Error fetching messages", err);
    }
  };

  useEffect(() => {
    if (!user?._id) return;

    chatSocket.emit("setup", user);

    chatSocket.on("connected", () => {
      console.log("Socket connected");
    });

    chatSocket.on("message received", (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    fetchMessages();

    return () => {
      chatSocket.off("connected");
      chatSocket.off("message received");
    };
  }, [user]);

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

      chatSocket.emit("new message", data);
    } catch (err) {
      console.error("Message send error", err);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[85vh] rounded-xl bg-white/20 shadow-lg backdrop-blur border border-gray-300">
        
      {/* Header */}
      <div className="px-6 py-4 bg-indigo-100 border-b border-indigo-300 text-indigo-900 rounded-t-xl">
        <h2 className="text-base font-semibold text-center">
          Chat with {user?.name || "User"}
        </h2>
      </div>

      {/* Chat messages */}
      <div className="flex-1 p-6 overflow-y-auto bg-white/40 flex flex-col">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`px-5 py-3 mb-2 text-sm rounded-3xl max-w-[70%] shadow 
              ${
                msg.sender === user._id
                  ? "self-end bg-indigo-300 text-gray-900 rounded-br-none"
                  : "self-start bg-indigo-100 text-gray-800 rounded-bl-none"
              }`}
          >
            {msg.message}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex gap-4 px-6 py-4 bg-white/20 backdrop-blur border-t border-gray-200 rounded-b-xl"
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white/80 text-gray-900"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="px-5 py-2 bg-gradient-to-br from-blue-300 to-indigo-500 text-white text-sm font-medium rounded-md hover:opacity-90 transition disabled:from-gray-300/40 disabled:to-gray-300/40 disabled:text-white/30"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
