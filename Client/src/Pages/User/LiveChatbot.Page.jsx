import { useEffect, useState } from "react";
import ChatBotComponent from "../../Components/User/ChatWindow";

const LiveChat = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("User_Chat_Bot_Token");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser({ _id: parsed._id });
        setToken(parsed.token);
      } catch (err) {
        console.error("Invalid token in localStorage:", err);
      }
    }
  }, []);

  console.log("LiveChat user:", user);
  console.log("LiveChat token:", token);
  if (!user || !token) return <p>Loading or unauthorized...</p>;

  return <ChatBotComponent user={user} token={token} />;
};

export default LiveChat;
