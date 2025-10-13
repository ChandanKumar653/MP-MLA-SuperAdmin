// src/routes/AdminRoutes.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";
import Layout from "../layouts/Layout";
// import { adminMenus } from "../constants/sidebarItems";

export default function AdminRoutes() {
    const adminMenus=[]
  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
            <Layout role="admin" sidebarItems={adminMenus} />
          </ProtectedRoute>
        }
      >

        <Route path="*" element={<>Admin Routes Not found</>} />


      </Route>
    </Routes>
  );
}
