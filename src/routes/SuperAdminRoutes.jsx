import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../layouts/Layout";
import DashboardPage from "../pages/Dashboard";
import FormViewerPage from "../pages/FormViewerPage";
import MenuManagerPage from "../pages/MenuManagerPage";

const SuperAdminRoutes = () => {
  const menus = JSON.parse(localStorage.getItem("menuTree") || "[]");

  const generateRoutes = (list) =>
    list.map((menu) => {
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
      <Route path="/" element={<Layout role="superadmin" />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="menus" element={<MenuManagerPage />} />
        {generateRoutes(menus)}
        {/* <Route path="*" element={<Navigate to="dashboard" replace />} /> */}
      </Route>
    </Routes>
  );
};

export default SuperAdminRoutes;










// import { Routes, Route, Navigate } from "react-router-dom";
// import Layout from "../layouts/Layout";
// import ProtectedRoute from "../components/common/ProtectedRoute";
// import Dashboard from "../pages/Dashboard";
// import MenuManagerPage from "../pages/MenuManagerPage";
// import FormViewerPage from "../pages/FormViewerPage";

// export default function SuperAdminRoutes() {
//   const superAdminMenus = [
//     { id: 1, name: "Dashboard", path: "dashboard" },
//     { id: 2, name: "Menus", path: "menus" },
//     { id: 3, name: "Form Viewer", path: "viewer/sample-form" },
//   ];

//   return (
//     <Routes>
//       <Route
//         element={
//           <ProtectedRoute allowedRoles={["superadmin"]}>
//             <Layout role="superadmin" sidebarItems={superAdminMenus} />
//           </ProtectedRoute>
//         }
//       >
//         <Route path="dashboard" element={<Dashboard />} />
//         <Route path="menus" element={<MenuManagerPage />} />
//         <Route path="viewer/:menuId" element={<FormViewerPage />} />

//         <Route path="*" element={<Navigate to="dashboard" replace />} />
//       </Route>
//     </Routes>
//   );
// }
