// import { Routes, Route, Navigate } from "react-router-dom";
// import Layout from "../layouts/Layout";
// import DashboardPage from "../pages/Dashboard";
// import FormViewerPage from "../pages/FormViewerPage";
// import MenuManagerPage from "../pages/MenuManagerPage";
// import { useContext, useMemo } from "react";
// import { MenuContext } from "../context/MenuContext";
// import NotFoundPage from "../pages/NotFoundPage";
// import TableViewerPage from "../components/common/TableViewerPage";
// const AdminRoutes = () => {
//   const { menus } = useContext(MenuContext);

//   // NEW → menus.tabs is always guaranteed array
//   const menuList = useMemo(() => {
//     return Array.isArray(menus?.tabs) ? menus.tabs : [];
//   }, [menus]);

//   console.log("ROUTES → tabs:", menuList);

//   /* --------------------------------------------------------
//      RECURSIVE FUNCTION TO GENERATE ROUTES
//   ---------------------------------------------------------*/
//   const generateDynamicRoutes = (items, basePath = "") => {
//     if (!items || !items.length) return null;

//     return items.map((menu) => {
//       const path = `${basePath}/${menu.id}`.replace("//", "/");
//       const children = menu.children || [];

//       const hasChildren = children.length > 0;

//       if (hasChildren) {
//         return (
//           <Route key={menu.id} path={menu.id}>
//             {/* redirect parent → first child */}
//             <Route
//               index
//               element={<Navigate to={children[0].id} replace />}
//             />

//             {/* generate nested children */}
//             {generateDynamicRoutes(children)}
//           </Route>
//         );
//       }

//       // LEAF MENU → load FormViewer
//       return (
//         <Route
//           key={menu.id}
//           path={menu.id}
//           element={
//             // <FormViewerPage
//             //   formData={menu.formSchema || []}
//             //   tableName={menu.tableName}
//             // />
//             <TableViewerPage />
//           }
//         />
//       );
//     });
//   };

//   const dynamicRoutes = useMemo(
//     () => generateDynamicRoutes(menuList),
//     [menuList]
//   );

//   return (
//     <Routes>
//       {/* MAIN ADMIN LAYOUT */}
//       <Route path="/" element={<Layout role="admin" />}>
//         {/* DEFAULT REDIRECT */}
//         <Route index element={<Navigate to="dashboard" replace />} />

//         {/* STATIC ROUTES */}
//         <Route path="dashboard" element={<DashboardPage />} />
//         <Route path="menus" element={<MenuManagerPage />} />

//         {/* DYNAMIC ROUTES BASED ON MENU SCHEMA */}
//         {dynamicRoutes}

//         {/* Unknown paths inside admin layout */}
//         <Route path="*" element={<NotFoundPage />} />
//       </Route>

//       {/* GLOBAL 404 */}
//       <Route path="*" element={<NotFoundPage />} />
//     </Routes>
//   );
// };

// export default AdminRoutes;


import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../layouts/Layout";
import DashboardPage from "../pages/Dashboard";
import MenuManagerPage from "../pages/MenuManagerPage";
import FormViewerPage from "../pages/FormViewerPage";
import TableViewerPage from "../components/common/TableViewerPage";
import NotFoundPage from "../pages/NotFoundPage";

import { useContext, useMemo } from "react";
import { MenuContext } from "../context/MenuContext";

const AdminRoutes = () => {
  const { menus } = useContext(MenuContext);

  const menuList = useMemo(() => {
    return Array.isArray(menus?.tabs) ? menus.tabs : [];
  }, [menus]);

  /* --------------------------------------------------------
     RECURSIVE ROUTE BUILDER
  ---------------------------------------------------------*/
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

      // LEAF NODE → Send entire menu object
      return (
        <Route
          key={menu.id}
          path={menu.id}
          element={
            <TableViewerPage menu={menu} />
            // OR if form:
            // <FormViewerPage menu={menu} />
          }
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
      <Route path="/" element={<Layout role="admin" />}>
        <Route index element={<Navigate to="dashboard" replace />} />

        {/* Static */}
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="menus" element={<MenuManagerPage />} />

        {/* Dynamic from menus */}
        {dynamicRoutes}

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AdminRoutes;
