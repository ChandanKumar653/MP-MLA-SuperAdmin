import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { MenuProvider } from "./context/MenuContext.jsx";
import { OrganizationProvider } from './context/OrganizationContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { Toaster } from "react-hot-toast";
import { BrowserRouter as Router } from "react-router-dom";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
    <AuthProvider>
    <MenuProvider>
      <OrganizationProvider>
    <App />
    </OrganizationProvider>
    </MenuProvider>
    </AuthProvider>
     <Toaster position="top-right" reverseOrder={false} />
     </Router>
  </StrictMode>,
)
