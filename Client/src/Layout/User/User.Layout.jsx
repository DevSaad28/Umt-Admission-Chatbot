import { Outlet } from "react-router-dom"
import NavBar from "../../Components/User/Navbar/Navbar.component"
import { useToast } from "../../Components/Toast/toast"

const Main = () => {
  const { ToastList } = useToast()

  return (
    <>
      {/* Render the ToastList at the top level */}
      <ToastList />

      <NavBar />
      <Outlet />
    </>
  )
}

export default Main
