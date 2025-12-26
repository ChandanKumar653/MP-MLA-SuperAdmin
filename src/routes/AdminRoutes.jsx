import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../layouts/Layout";
import DashboardPage from "../pages/superadmin/dashboard/Dashboard";    

import MenuManagerPage from "../pages/admin/menu-manager/MenuManagerPage";
import FormViewerPage from "../pages/admin/menu-manager/FormViewerPage"
import TableViewerPage from "../components/common/TableViewerPage";
import NotFoundPage from "../pages/NotFoundPage";

import UsersList from "../pages/admin/user-management/UsersList"; 
import { useContext, useMemo } from "react";
import { MenuContext } from "../context/MenuContext";
import Dashboard from "../pages/admin/dashboard/Dashboard";

const AdminRoutes = () => {
  const { menus } = useContext(MenuContext);

  const menuList = useMemo(() => {
    return Array.isArray(menus?.tabs) ? menus.tabs : [];
  }, [menus]);

  // Recursive dynamic route builder
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

      // LEAF NODE → TableViewer for each menu item
      return (
        <Route
          key={menu.id}
          path={menu.id}
          element={<TableViewerPage menu={menu} />}
        />
      );
    });
  };

  const dynamicRoutes = useMemo(() => generateDynamicRoutes(menuList), [menuList]);

  return (
    <Routes>
      <Route path="/" element={<Layout role="admin" />}>
        <Route index element={<Navigate to="dashboard" replace />} />

        {/* STATIC ROUTES */}
        <Route path="dashboard" element={<DashboardPage />} />
        {/* <Route path="dashboard" element={<Dashboard />} /> */}
        <Route path="menus" element={<MenuManagerPage />} />
        <Route path="form-viewer/:menuId" element={<FormViewerPage />} />

        {/* ADMIN ONLY: USER MANAGEMENT */}
        <Route path="users" element={<UsersList />} />

        {/* DYNAMIC ROUTES */}
        {dynamicRoutes}

        {/* INSIDE ADMIN 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* GLOBAL 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AdminRoutes;
