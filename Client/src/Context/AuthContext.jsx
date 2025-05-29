import { createContext, useContext, useEffect, useState } from "react"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    // Check both localStorage and sessionStorage for stored user
    const localStoredUser = localStorage.getItem("User_Chat_App_Token")
    const sessionStoredUser = sessionStorage.getItem("User_Chat_App_Token")

    if (localStoredUser) {
      setUser(JSON.parse(localStoredUser))
      setRememberMe(true) // User was stored in localStorage, so rememberMe was true
    } else if (sessionStoredUser) {
      setUser(JSON.parse(sessionStoredUser))
      setRememberMe(false) // User was stored in sessionStorage, so rememberMe was false
    }

    setLoading(false)
  }, [])

  const login = (userData, remember = false) => {
    setRememberMe(remember)

    if (remember) {
      // Store in localStorage for persistent login
      localStorage.setItem("User_Chat_App_Token", JSON.stringify(userData))
      // Clear sessionStorage if it exists
      sessionStorage.removeItem("User_Chat_App_Token")
    } else {
      // Store in sessionStorage for session-only login
      sessionStorage.setItem("User_Chat_App_Token", JSON.stringify(userData))
      // Clear localStorage if it exists
      localStorage.removeItem("User_Chat_App_Token")
    }

    setUser(userData)
  }

  const logout = () => {
    // Clear from both storages to ensure complete logout
    localStorage.removeItem("User_Chat_App_Token")
    sessionStorage.removeItem("User_Chat_App_Token")
    setUser(null)
    setRememberMe(false)
  }

  const toggleRememberMe = () => {
    const newRememberMe = !rememberMe
    setRememberMe(newRememberMe)

    // If user is logged in, move the token to the appropriate storage
    if (user) {
      if (newRememberMe) {
        // Move from sessionStorage to localStorage
        const userData = sessionStorage.getItem("User_Chat_App_Token")
        if (userData) {
          localStorage.setItem("User_Chat_App_Token", userData)
          sessionStorage.removeItem("User_Chat_App_Token")
        }
      } else {
        // Move from localStorage to sessionStorage
        const userData = localStorage.getItem("User_Chat_App_Token")
        if (userData) {
          sessionStorage.setItem("User_Chat_App_Token", userData)
          localStorage.removeItem("User_Chat_App_Token")
        }
      }
    }
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated,
        loading,
        rememberMe,
        setRememberMe,
        toggleRememberMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
