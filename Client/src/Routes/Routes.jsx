import Login from "../Pages/User/Login.Page";
import ChatBot from "../Pages/User/ChatBot.Page";
import AuthLayout from "../Layout/Auth/Auth.Layout";
import UserLayout from "../Layout/User/User.Layout";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { PrivateRoute, PublicRoute } from "./ProtectedRoutes";
import LiveChat from "../Pages/User/LiveChatbot.Page";
import ChatDashboard from "../Pages/Admin/ChatDashboard";
const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthLayout />,
    children: [
      {
        path: "",
        element: (
          <PublicRoute>
            <Login />
          </PublicRoute>
        ),
      },
    ],
  },
  {
    path: "/chat",
    element: (
      <PrivateRoute>
        <UserLayout /> {/* Navbar is now protected */}
      </PrivateRoute>
    ),
    children: [
      {
        path: "",
        element: <ChatBot />,
      },
       {
        path: "livechat",
        element: <LiveChat />,
      },
      {
        path: "adminchat",
        element: <ChatDashboard />,
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
