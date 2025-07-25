import { useEffect, useState } from "react";
import axios from "axios";
import ChatWindow from "../../Components/Admin/ChatWindow";
import { AllUsers } from "../../url";

const ChatDashboard = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const token = JSON.parse(localStorage.getItem("User_Chat_Bot_Token"))?.token;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get(AllUsers, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(data);
      } catch (err) {
        console.error("Failed to fetch chat users", err);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="flex h-screen  items-center justify-center ">
        <div className="flex max-w-7xl h-[90vh] mx-auto border border-gray-300 rounded-xl shadow-lg bg-white/30 backdrop-blur overflow-hidden">
      {/* Sidebar */}
      <div className="w-[280px] border-r border-gray-300 bg-white/40 backdrop-blur flex flex-col">
        <h3 className="text-center px-4 py-5 text-lg font-semibold text-indigo-900 border-b border-gray-300">
          All Users
        </h3>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {users.map((user) => (
            <div
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`flex items-center gap-3 px-4 py-3 border-b border-gray-200 cursor-pointer transition-all 
                ${
                  selectedUser?._id === user._id
                    ? "bg-gradient-to-r from-indigo-100 to-indigo-200"
                    : "hover:bg-gray-100"
                }`}
            >
              <div className="bg-indigo-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-semibold">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="font-medium text-gray-800 truncate">{user.name}</div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 bg-white/40 backdrop-blur">
        {selectedUser ? (
          <ChatWindow user={selectedUser} token={token} />
        ) : (
          <div className="flex items-center min-w-100 justify-center h-full text-gray-600 font-medium text-base">
            Select a User
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default ChatDashboard;
