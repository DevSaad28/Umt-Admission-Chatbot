import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { chatSocket } from "../../Socket/chatSocket";
import { LiveChatSend, LiveConversation } from "../../url";

const ADMIN_ID = "6883df2c8a712fda91389b6a";

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

  useEffect(() => {
    if (!user?._id || !token) return;

    const fetchMessages = async () => {
      try {
        const { data } = await axios.get(`${LiveConversation}?userId=${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(Array.isArray(data) ? data : data.messages || []);
        scrollToBottom();
      } catch (err) {
        console.error("Fetch failed", err);
      }
    };

    chatSocket.emit("setup", { _id: ADMIN_ID });

    chatSocket.on("message received", (msg) => {
      if (
        (msg.sender === user._id && msg.receiver === ADMIN_ID) ||
        (msg.sender === ADMIN_ID && msg.receiver === user._id)
      ) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
    });

    fetchMessages();

    return () => {
      chatSocket.off("message received");
    };
  }, [user?._id, token]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const { data } = await axios.post(
        LiveChatSend,
        {
          message,
          receiver: user._id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      chatSocket.emit("new message", {
        sender: ADMIN_ID,
        receiver: user._id,
        message,
      });

      setMessages((prev) => [...prev, data]);
      setMessage("");
      scrollToBottom();
    } catch (err) {
      console.error("Send failed", err);
    }
  };

  return (
    <div className="w-full  max-w-3xl mx-auto flex flex-col h-[90vh] rounded-r-xl bg-white/20 shadow-lg backdrop-blur border border-gray-300">
      {/* Header */}
      <div className="px-6 py-4 bg-white/30 backdrop-blur border-b border-indigo-200 text-indigo-900 rounded-t-xl text-center font-semibold">
        Conversation with {user?.name || "User"}
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-white/40 backdrop-blur flex flex-col">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`px-5 py-3 mb-2 text-sm rounded-3xl max-w-[70%] shadow
              ${
                msg.sender === ADMIN_ID
                  ? "self-end bg-gradient-to-br from-blue-300 to-indigo-500 text-white rounded-tr-none"
                  : "self-start bg-indigo-100 text-gray-800 rounded-tl-none"
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
        className="flex gap-4 px-6 py-4 bg-white/20 border-t border-gray-200 rounded-b-xl backdrop-blur"
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-md bg-white/80 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
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
