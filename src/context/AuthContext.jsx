import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {jwtDecode} from 'jwt-decode';
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    const storedTenantId = localStorage.getItem("tenantId");
    const storedUserId = localStorage.getItem("userId");

    if (storedUser) setUser(storedUser);
    if (storedToken) setToken(storedToken);
    if (storedRole) setRole(storedRole);
    if (storedTenantId) setTenantId(storedTenantId);
    if (storedUserId) setUserId(storedUserId);
  }, []);

  const login = ({ username, role, token,tenantId,userId}) => {
    const loggedInUser = { username, role };
    setUser(loggedInUser);
    setToken(token);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    localStorage.setItem("token", token);
    localStorage.setItem("tenantId", tenantId);
    localStorage.setItem("role", role);
    localStorage.setItem("userId", userId);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("tenantId");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
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
    <AuthContext.Provider value={{ user, token, login, logout,getDecodedToken,role,tenantId,userId }}>
      {children}
    </AuthContext.Provider>
  );
};
