import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {jwtDecode} from 'jwt-decode';
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const storedToken = localStorage.getItem("token");
    if (storedUser) setUser(storedUser);
    if (storedToken) setToken(storedToken);
  }, []);

  const login = ({ username, role, token }) => {
    const loggedInUser = { username, role };
    setUser(loggedInUser);
    setToken(token);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    localStorage.setItem("token", token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  useEffect(() => {
    const handleTokenExpired = () => {
      toast.error("Session expired. Please log in again.");
      logout();
      navigate("/login", { replace: true }); 
    };

    window.addEventListener("tokenExpired", handleTokenExpired);
    return () => window.removeEventListener("tokenExpired", handleTokenExpired);
  }, [navigate]);


const getDecodedToken = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");
    return jwtDecode(token);
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
};

  return (
    <AuthContext.Provider value={{ user, token, login, logout,getDecodedToken }}>
      {children}
    </AuthContext.Provider>
  );
};
