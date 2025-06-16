import { useAuth } from "../../../Context/AuthContext"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import { LogOut, User } from "lucide-react"

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogin = () => {
    navigate("/")
  }

  const handleSignup = () => {
    navigate("/")
  }

  const handleLogout = () => {
    try {
      logout()
      toast.success("Successfully logged out!", {
        duration: 3000,
        position: "top-center",
        style: {
          background: "#10B981",
          color: "#fff",
        },
        iconTheme: {
          primary: "#fff",
          secondary: "#10B981",
        },
      })
      navigate("/")
    } catch (error) {
      toast.error("Error logging out. Please try again.", {
        duration: 3000,
        position: "top-center",
        style: {
          background: "#EF4444",
          color: "#fff",
        },
        iconTheme: {
          primary: "#fff",
          secondary: "#EF4444",
        },
      })
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="w-28 flex items-center">
          <img className="mt-1" src="/images/logo.png" alt="Logo" />
        </div>

        {/* Right side buttons */}
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            // Authenticated user UI
            <div className="flex items-center space-x-3">
              {/* User info */}
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700 font-medium text-sm">{user?.name || user?.email || "User"}</span>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors hover:cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            // Non-authenticated user UI
            <>
              {/* Log in button */}
              <button
                onClick={handleLogin}
                className="px-4 py-2 border border-primary rounded-lg text-primary hover:bg-gray-50 transition-colors hover:cursor-pointer"
              >
                Log in
              </button>

              {/* Sign up button */}
              <button
                onClick={handleSignup}
                className="px-4 py-2 border bg-primary text-white rounded-lg hover:bg-transparent hover:text-primary hover:cursor-pointer transition-colors"
              >
                Sign up
              </button>
            </>
          )}

          {/* Language selector - commented out as in original */}
          {/* <div className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <Globe className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700 font-medium">EN</span>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </div> */}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
