import Login from "../Pages/User/Login.Page";
import ChatBot from "../Pages/User/ChatBot.Page";
import AuthLayout from "../Layout/Auth/Auth.Layout";
import UserLayout from "../Layout/User/User.Layout";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { PrivateRoute, PublicRoute } from "./ProtectedRoutes";

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
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
