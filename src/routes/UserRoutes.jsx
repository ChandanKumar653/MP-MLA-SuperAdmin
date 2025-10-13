// src/routes/UserRoutes.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";
import Layout from "../layouts/Layout";

export default function UserRoutes() {
    const userMenus=[]
  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute allowedRoles={["user", "superadmin","admin"]}>
            <Layout role="user" sidebarItems={userMenus} />
          </ProtectedRoute>
        }
      >
                <Route path="*" element={<>Admin Routes Not found</>} />
      </Route>
    </Routes>
  );
}
