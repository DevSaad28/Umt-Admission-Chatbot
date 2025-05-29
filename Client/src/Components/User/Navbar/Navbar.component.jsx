import {useAuth} from "../../../Context/AuthContext"

const Navbar = () => {

  const {logout} = useAuth()
  return (
    <nav className="bg-white border-b border-gray-200 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="w-28 flex items-center">
          <img className="mt-1" src="/images/logo.png"></img>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center space-x-3">       

          {/* Log out*/}
          <button
          onClick={()=>{
            logout()
          }}
           className="px-4 py-2 border bg-primary text-white rounded-lg hover:bg-transparent    hover:text-primary hover:cursor-pointer transition-colors">
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
