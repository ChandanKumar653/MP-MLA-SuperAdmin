import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../layouts/Layout";
import ProtectedRoute from "../components/common/ProtectedRoute";

export default function UserRoutes() {
  const userMenus = []; 

  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute allowedRoles={["user", "admin", "superadmin"]}>
            <Layout role="user" sidebarItems={userMenus} />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<div>User Dashboard</div>} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
