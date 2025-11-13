import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../layouts/Layout";
import DashboardPage from "../pages/Dashboard";
import FormViewerPage from "../pages/FormViewerPage";
import MenuManagerPage from "../pages/MenuManagerPage";
import { useContext, useMemo } from "react";
import { MenuContext } from "../context/MenuContext";
import NotFoundPage from "../pages/NotFoundPage";

const AdminRoutes = () => {
  const { menus } = useContext(MenuContext);

  // Safely ensure menus is always an array (even if string or null)
  const menuList = useMemo(() => {
    if (Array.isArray(menus)) return menus;
    if (typeof menus === "string") {
      try {
        return JSON.parse(menus);
      } catch (e) {
        console.error("Failed to parse menus:", e);
        return [];
      }
    }
    return [];
  }, [menus]);
  console.log("AdminRoutes - menuList:", menuList);

  // Recursively generate routes from menu tree
  const generateDynamicRoutes = (items) => {
    if (!items || items.length === 0) return null;

    return items?.map((menu) => {
      const hasChildren = menu.children && menu.children.length > 0;

      if (hasChildren) {
        // Parent menu → create a route that can have nested children
        return (
          <Route key={menu.id} path={menu.id}>
            {/* Optional: show something on parent path */}
            <Route index element={<Navigate to={menu.children[0].id} replace />} />
            {generateDynamicRoutes(menu.children)}
          </Route>
        );
      } else {
        // Leaf menu → render FormViewer
        return (
          <Route
            key={menu.id}
            path={menu.id}
            element={<FormViewerPage formData={menu.formSchema || []} tableName={menu.tableName} />}
          />
        );
      }
    });
  };

  // Memoize the generated routes to avoid re-creating on every render
  const dynamicRoutes = useMemo(() => {
    return generateDynamicRoutes(menuList);
  }, [menuList]);

  return (
    <Routes>
      <Route path="/" element={<Layout role="admin" />}>
        {/* Static routes */}
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="menus" element={<MenuManagerPage />} />

        {/* Dynamic routes from menu schema */}
        {dynamicRoutes}

        {/* Catch-all: redirect unknown paths */}
        {/* <Route path="*" element={<Navigate to="dashboard" replace />} /> */}
      </Route>

      {/* Optional: Global 404 outside layout */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AdminRoutes;