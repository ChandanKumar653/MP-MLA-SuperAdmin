import React, { useContext, useMemo } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../layouts/Layout";
import ProtectedRoute from "../components/common/ProtectedRoute";
import { MenuContext } from "../context/MenuContext";

import TableViewerPage from "../components/common/TableViewerPage";
import FormViewerPage from "../pages/admin/menu-manager/FormViewerPage";
import UserDashboardPage from "../pages/user/UserDashboardPage";

export default function UserRoutes() {
  const { menus } = useContext(MenuContext);

  /* ---------------- SAFE MENU LIST ---------------- */
  const menuList = useMemo(() => {
    return Array.isArray(menus?.tabs) ? menus.tabs : [];
  }, [menus]);

  /* ---------------- RECURSIVE ROUTE BUILDER ---------------- */
  const generateDynamicRoutes = (items) => {
    if (!Array.isArray(items) || items.length === 0) return null;

    return items.map((menu) => {
      const children = menu.children || [];

      /* ---------- PARENT NODE ---------- */
      if (children.length > 0) {
        return (
          <Route key={menu.id} path={menu.id}>
            {/* auto-redirect to first child */}
            <Route index element={<Navigate to={children[0].id} replace />} />
            {generateDynamicRoutes(children)}
          </Route>
        );
      }

      /* ---------- LEAF NODE ---------- */
      /* USER ALWAYS SEES TABLE */
      return (
        <Route
          key={menu.id}
          path={menu.id}
          element={
            <TableViewerPage
              menu={menu}
              accessLevel={menu.access_level} // 🔑 read / write
            />
          }
        />
      );
    });
  };

  const dynamicRoutes = useMemo(
    () => generateDynamicRoutes(menuList),
    [menuList]
  );

  /* ---------------- ROUTES ---------------- */
  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute allowedRoles={["user", "admin", "superadmin"]}>
            <Layout role="user" />
          </ProtectedRoute>
        }
      >
        {/* DEFAULT */}
        <Route index element={<Navigate to="dashboard" replace />} />

        {/* DASHBOARD */}
        <Route path="dashboard" element={<UserDashboardPage />} />

        {/* DYNAMIC MENU ROUTES */}
        {dynamicRoutes}


        {/* FORM VIEWER (FINAL GUARD INSIDE PAGE) */}
        <Route path="/form-viewer/:menuId" element={<FormViewerPage />} />

        {/* FALLBACK */}
        {/* <Route path="*" element={<Navigate to="dashboard" replace />} /> */}
      </Route>
    </Routes>
  );
}
