import { createRoot } from "react-dom/client";
import "./index.css";
import Router from "./Routes/Routes.jsx";
import { AuthProvider } from "./Context/AuthContext.jsx";

createRoot(document.getElementById("root")).render(

    <AuthProvider>
        <Router />
    </AuthProvider>

);
