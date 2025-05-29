import { Outlet } from "react-router-dom";



// Components
import Navbar from "../../Components/User/Navbar/Navbar.component";

const Main = () => {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

export default Main;
