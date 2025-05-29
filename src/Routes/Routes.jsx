// User Layout
import Main from "../Layout/User/User.layout";
import Login from "../Pages/User/Login.Page";

// Router
import { createBrowserRouter } from "react-router-dom";

// User Pages

import ChatBot from "../Components/User/ChatBot/ChatBot.component";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Main />,
    children: [{path : "", element : <Login/>},
      {path : "/chatbot", element : <ChatBot/>},
      

    ],
  },
]);

export default router;
