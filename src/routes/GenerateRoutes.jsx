import { Routes, Route } from "react-router-dom";

export const generateRoutes = (menuData, basePath = "") => {
  return menuData.map((menu) => {
    const path = `${basePath}${menu.path}`;

    if (menu.children) {
      return (
        <Route key={menu.id} path={menu.path} element={menu.element || <Outlet />}>
          {generateRoutes(menu.children, `${path}/`)}
        </Route>
      );
    }

    return <Route key={menu.id} path={menu.path} element={menu.element} />;
  });
};
