// User Layout
import Main from "../Layout/User/User.layout";

// Router
import { createBrowserRouter } from "react-router-dom";

// User Pages
import Login from "../Pages/User/Login.Page";
import ChatBot from "../Components/User/ChatBot/ChatBot.component";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Main />,
    children: [{path : "", element : <Login/>},
      {path : "/chatbot", element : <ChatBot/>}

    ],
  },
]);

export default router;
