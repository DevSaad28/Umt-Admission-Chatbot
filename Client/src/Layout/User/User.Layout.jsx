import { Outlet } from "react-router-dom"
import NavBar from "../../Components/User/Navbar/Navbar.component"
import { useToast } from "../../Components/Toast/toast"

const Main = () => {
  const { ToastList } = useToast()

  return (
    <>
      {/* Render the ToastList at the top level */}
      <ToastList />

      <div className="flex  bg-gradient-to-br from-blue-500 via-indigo-300 to-indigo-500">
        <NavBar />
        <Outlet />
      </div>
    </>
  )
}

export default Main
