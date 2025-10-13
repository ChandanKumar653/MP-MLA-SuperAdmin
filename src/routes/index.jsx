import React from "react";
import { Routes, Route } from "react-router-dom";
import SuperAdminRoutes from "./SuperAdminRoutes";
import AdminRoutes from "./AdminRoutes";
import UserRoutes from "./UserRoutes";
import Login from "../pages/auth/Login";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Login />} />
      <Route path="/superadmin/*" element={<SuperAdminRoutes />} />
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/user/*" element={<UserRoutes />} />
      <Route path="*" element={<div>Home / Not Found</div>} />
    </Routes>
  );
}
