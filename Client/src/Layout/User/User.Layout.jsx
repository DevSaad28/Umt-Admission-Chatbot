"use client"
import { Outlet } from "react-router-dom"
import Navbar from "../../Components/Navbar/navbar"
import { useToast } from "../../Components/Toast/toast"

const Main = () => {
  const { ToastList } = useToast()

  return (
    <>
      {/* Render the ToastList at the top level */}
      <ToastList />

      <Navbar />
      <Outlet />
    </>
  )
}

export default Main
