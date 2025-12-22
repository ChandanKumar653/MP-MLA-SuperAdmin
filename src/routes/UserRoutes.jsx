import React, { useContext, useMemo } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../layouts/Layout";
import ProtectedRoute from "../components/common/ProtectedRoute";
import { MenuContext } from "../context/MenuContext";
import FormViewerPage from "../pages/admin/menu-manager/FormViewerPage";
import UserDashboardPage from "../pages/user/UserDashboardPage";
export default function UserRoutes() {
  const userMenus = [];
  const { menus } = useContext(MenuContext);

  const menuList = useMemo(() => {
    return Array.isArray(menus?.tabs) ? menus.tabs : [];
  }, [menus]);

  const generateDynamicRoutes = (items) => {
    if (!items || items.length === 0) return null;

    return items.map((menu) => {
      const children = menu.children || [];

      if (children.length > 0) {
        return (
          <Route key={menu.id} path={menu.id}>
            <Route index element={<Navigate to={children[0].id} replace />} />
            {generateDynamicRoutes(children)}
          </Route>
        );
      }

      // ✅ LEAF NODE → REDIRECT TO FORM VIEWER
      return (
        <Route
          key={menu.id}
          path={menu.id}
          element={<Navigate to={`/user/form-viewer/${menu.id}`} replace />}
        />
      );
    });
  };

  const dynamicRoutes = useMemo(
    () => generateDynamicRoutes(menuList),
    [menuList]
  );

  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute allowedRoles={["user", "admin", "superadmin"]}>
            <Layout role="user" sidebarItems={userMenus} />
          </ProtectedRoute>
        }
      >
        {/* Dynamic menu routes */}
        {dynamicRoutes}

        {/* Explicit routes */}
        <Route path="dashboard" element={<UserDashboardPage/>} />
        <Route path="form-viewer/:menuId" element={<FormViewerPage />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
