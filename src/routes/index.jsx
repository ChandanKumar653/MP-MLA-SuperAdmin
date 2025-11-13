import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SuperAdminRoutes from "./SuperAdminRoutes";
import AdminRoutes from "./AdminRoutes";
import UserRoutes from "./UserRoutes";
import Login from "../pages/auth/Login";
import { AuthContext } from "../context/AuthContext";

export default function AppRoutes() {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to={user ? `/${user.role}/dashboard` : "/login"} />} />

      {/* Role-based routes */}
      <Route path="/superadmin/*" element={<SuperAdminRoutes />} />
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/user/*" element={<UserRoutes />} />

      {/* Fallback */}
      <Route path="*" element={<div>Not Found</div>} />
    </Routes>
  );
}
