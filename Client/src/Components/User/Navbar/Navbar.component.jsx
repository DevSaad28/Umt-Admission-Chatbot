const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="w-28 flex items-center">
          <img className="mt-1" src="/images/logo.png"></img>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center space-x-3">
          {/* Log in button */}
          <button className="px-4 py-2 border border-primary rounded-lg text-primary hover:bg-gray-50 transition-colors hover:cursor-pointer ">
            Log in
          </button>

          {/* Sign up button */}
          <button className="px-4 py-2 border bg-primary text-white rounded-lg hover:bg-transparent    hover:text-primary hover:cursor-pointer transition-colors">
            Sign up
          </button>

          {/* Language selector */}
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
