import { Navigate } from "react-router-dom"
import { useAuth } from "../Context/AuthContext"
import Loader from "../Components/Loader/loader"
import { useState, useEffect } from "react"

export const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  const [delayComplete, setDelayComplete] = useState(false)

  useEffect(() => {
   
    if (!loading) {
      const timer = setTimeout(() => {
        setDelayComplete(true)
      }, 2000) 

      return () => clearTimeout(timer)
    }
  }, [loading])


  if (loading || !delayComplete) {
    return <Loader />
  }

  return isAuthenticated ? children : <Navigate to="/" />
}

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  const [delayComplete, setDelayComplete] = useState(false)

  useEffect(() => {
  
    if (!loading) {
      const timer = setTimeout(() => {
        setDelayComplete(true)
      }, 2000) 

      return () => clearTimeout(timer)
    }
  }, [loading])


  if (loading || !delayComplete) {
    return <Loader />
  }

  return isAuthenticated ? <Navigate to="/chatbot" /> : children
}
