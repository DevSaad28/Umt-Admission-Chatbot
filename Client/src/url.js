const Base_Url = "http://localhost:5000";
const API_BASE_URL = "http://localhost:8000";
const User_Signup = `${Base_Url}/api/user/register`;
const User_Login = `${Base_Url}/api/user/login`;
const User_Search = `${Base_Url}/api/user`;


const LiveConversation = `${Base_Url}/api/livechat/conversation`;

const LiveChatSend = `${Base_Url}/api/livechat/send`;

const AllUsers = `${Base_Url}/api/livechat/users`;

export { User_Signup, User_Login, User_Search, API_BASE_URL ,Base_Url, LiveChatSend ,LiveConversation,AllUsers};
