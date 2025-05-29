import Authentication from "../Pages/Authentication";
import Chat from "../Pages/Chat";
import AuthLayout from "../Layout/Auth/Auth.Layout";
import UserLayout from "../Layout/User/User.Layout";
import ChatBot from "../Pages/User/ChatBot.Page";
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
            <Authentication />
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
