import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../layouts/Layout";
import DashboardPage from "../pages/Dashboard";
import FormViewerPage from "../pages/FormViewerPage";
import MenuManagerPage from "../pages/MenuManagerPage";
import { useContext } from "react";
import { MenuContext } from "../context/MenuContext";
const AdminRoutes = () => {
  // const menus = JSON.parse(localStorage.getItem("menuTree") || "[]");
const {menus}=useContext(MenuContext);
  const generateRoutes = (list) =>
    list?.map((menu) => {
      if (menu.children && menu.children.length > 0) {
        return (
          <Route key={menu.id} path={menu.id}>
            {generateRoutes(menu.children)}
          </Route>
        );
      } else {
        return (
          <Route
            key={menu.id}
            path={menu.id}
            element={<FormViewerPage formData={menu.formSchema || []} />}
          />
        );
      }
    });

  return (
    <Routes>
      <Route path="/" element={<Layout role="admin" />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="menus" element={<MenuManagerPage />} />
        {generateRoutes(menus)}
        {/* <Route path="*" element={<Navigate to="dashboard" replace />} /> */}
      </Route>
    </Routes>
  );
};

export default AdminRoutes;







