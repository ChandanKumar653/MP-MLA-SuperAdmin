import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../layouts/Layout";
import DashboardPage from "../pages/Dashboard";
import Organizations from "../pages/superadmin/Organizations";
import AdminRoutes from "./AdminRoutes"; // For entering admin portal
import UserRoutes from "./UserRoutes";   // Optional: entering user portal

export default function SuperAdminRoutes() {
  return (
    <Routes>
      <Route element={<Layout role="superadmin" />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="organizations" element={<Organizations />} />

        {/* Admin portal access for orgs */}
        <Route path="admin/*" element={<AdminRoutes />} />
        <Route path="user/*" element={<UserRoutes />} />

        {/* Redirect unknown */}
        {/* <Route path="*" element={<Navigate to="dashboard" replace />} /> */}
      </Route>
    </Routes>
  );
}
