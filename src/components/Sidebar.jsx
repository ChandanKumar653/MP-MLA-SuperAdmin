// src/components/Sidebar.jsx
import React, { useState, useEffect, useContext, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Dashboard,
  Logout,
  ExpandMore,
  Business,
  Brightness1,
  Menu as MenuIcon,
  Close as CloseIcon,
  Domain,
  Group,
} from "@mui/icons-material";
import { Divider, Tooltip, IconButton } from "@mui/material";

import { AuthContext } from "../context/AuthContext";
import { MenuContext } from "../context/MenuContext";

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const { menus } = useContext(MenuContext); 
  const location = useLocation();
  const navigate = useNavigate();

  const [openSubmenus, setOpenSubmenus] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);

  /* SAFE TABS */
  const tabs = useMemo(() => {
    if (!menus || !Array.isArray(menus.tabs)) return [];
    return menus.tabs;
  }, [menus]);

  /* AUTO-OPEN ACTIVE PARENT */
  useEffect(() => {
    if (!tabs.length) return;

    const openParents = {};

    const scan = (list, parentIds = []) => {
      list.forEach((menu) => {
        const path = `/${user?.role}/${menu.id}`;

        if (location.pathname.startsWith(path)) {
          parentIds.forEach((id) => (openParents[id] = true));
          if (menu.children?.length > 0) openParents[menu.id] = true;
        }

        if (menu.children?.length > 0) {
          scan(menu.children, [...parentIds, menu.id]);
        }
      });
    };

    scan(tabs);
    setOpenSubmenus((prev) => ({ ...prev, ...openParents }));
  }, [location.pathname, tabs, user?.role]);

  /* HELPERS */
  const toggleSubmenu = (id) => (e) => {
    e?.stopPropagation();
    setOpenSubmenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isActive = (menuId, parentPath = "") => {
    const fullPath = `/${user?.role}${parentPath}/${menuId}`;
    return location.pathname.startsWith(fullPath);
  };

  /* RECURSIVE MENU RENDERER */
  const renderMenuTree = (list, level = 0, parentPath = "") => {
    if (!Array.isArray(list)) return null;

    return list.map((menu) => {
      const currentPath = `${parentPath}/${menu.id}`;
      const fullPath = `/${user?.role}${currentPath}`;
      const hasChildren = menu.children?.length > 0;
      const isOpen = openSubmenus[menu.id] || false;
      const active = isActive(menu.id, parentPath);

      return (
        <div key={menu.id} className="flex flex-col w-full">
          <div
            className={`w-full transition-all duration-200 ${
              active
                ? "bg-gradient-to-r from-[#c63bff1a] to-[#e34bff1a] shadow-sm"
                : "hover:bg-[#faf5ff]"
            } rounded-xl`}
          >
            <div
              onClick={() => {
                if (hasChildren) toggleSubmenu(menu.id)();
                else {
                  navigate(fullPath);
                  setMobileOpen(false);
                }
              }}
              className={`flex items-center justify-between px-4 py-3 cursor-pointer text-left transition-all duration-300 ${
                active ? "text-[#c63bff] font-medium" : "text-[#c63bff]"
              }`}
              style={{ paddingLeft: `${16 * (level + 1)}px` }}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {menu.hasForm && (
                  <Brightness1 style={{ fontSize: 8, color: "#c63bff" }} />
                )}

                <Tooltip title={menu.title} arrow placement="right">
                  <span className="text-sm font-medium truncate">{menu.title}</span>
                </Tooltip>
              </div>

              {hasChildren && (
                <IconButton
                  onClick={toggleSubmenu(menu.id)}
                  size="small"
                  sx={{
                    color: "#c63bff",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.3s",
                  }}
                >
                  <ExpandMore fontSize="small" />
                </IconButton>
              )}
            </div>
          </div>

          {hasChildren && isOpen && (
            <div className="transition-all duration-300">
              {renderMenuTree(menu.children, level + 1, currentPath)}
            </div>
          )}
        </div>
      );
    });
  };

  /* BASE PATHS */
  const basePath = `/${user?.role}`;
  const isAdmin = user?.role === "admin";
  const isSuperAdmin = user?.role === "superadmin";

  return (
    <>
      {/* Mobile hamburger */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <IconButton
          onClick={() => setMobileOpen(!mobileOpen)}
          sx={{ color: "#a100ff" }}
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </IconButton>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed md:static z-40 h-screen w-64 bg-white flex flex-col justify-between transition-transform duration-300
           shadow-[4px_0_15px_-4px_rgba(161,0,255,0.05)]
           ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="px-6 py-5 flex justify-center items-center gap-2 text-[#dc51f4] text-2xl font-bold">
          <Business /> LOGO
        </div>
        <Divider />

        {/* Menu Content */}
        <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4 scrollbar-hide">

          {/* Dashboard */}
          <Link to={`${basePath}/dashboard`} onClick={() => setMobileOpen(false)}>
            <button
              className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-sm font-medium transition-all duration-300 cursor-pointer ${
                location.pathname === `${basePath}/dashboard`
                  ? "bg-gradient-to-r from-[#c63bff1a] to-[#e34bff1a] text-[#c63bff]"
                  : "text-[#c63bff] hover:bg-[#faf5ff]"
              }`}
            >
              <Dashboard />
              <Tooltip title="Dashboard" arrow placement="right">
                <span className="truncate">Dashboard</span>
              </Tooltip>
            </button>
          </Link>

          {/* Menu Manager (Admin only) */}
          {isAdmin && (
            <Link to={`${basePath}/menus`} onClick={() => setMobileOpen(false)}>
              <button
                className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-sm font-medium transition-all duration-300 cursor-pointer ${
                  location.pathname === `${basePath}/menus`
                    ? "bg-gradient-to-r from-[#c63bff1a] to-[#e34bff1a] text-[#c63bff]"
                    : "text-[#c63bff] hover:bg-[#faf5ff]"
                }`}
              >
                <Business />
                <Tooltip title="Menu Manager" arrow placement="right">
                  <span className="truncate">Menu Manager</span>
                </Tooltip>
              </button>
            </Link>
          )}

          {/* Organizations (SuperAdmin only) */}
          {isSuperAdmin && (
            <Link to={`${basePath}/organizations`} onClick={() => setMobileOpen(false)}>
              <button
                className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-sm font-medium transition-all duration-300 cursor-pointer ${
                  location.pathname.includes(`${basePath}/organizations`)
                    ? "bg-gradient-to-r from-[#c63bff1a] to-[#e34bff1a] text-[#c63bff]"
                    : "text-[#c63bff] hover:bg-[#faf5ff]"
                }`}
              >
                <Domain />
                <Tooltip title="Organizations" arrow placement="right">
                  <span className="truncate">Organizations</span>
                </Tooltip>
              </button>
            </Link>
          )}

          <Divider className="my-4" />

          {/* User Management (Admin only) */}
          {isAdmin && (
            <div className="mb-4">
              <Link
                to={`${basePath}/users`}
                onClick={() => setMobileOpen(false)}
              >
                <button
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-sm font-medium transition-all duration-300 cursor-pointer ${
                    location.pathname.includes(`${basePath}/users`)
                      ? "bg-gradient-to-r from-[#c63bff1a] to-[#e34bff1a] text-[#c63bff]"
                      : "text-[#c63bff] hover:bg-[#faf5ff]"
                  }`}
                >
                  <Group />
                  <Tooltip title="User Management" arrow placement="right">
                    <span className="truncate">User Management</span>
                  </Tooltip>
                </button>
              </Link>
            </div>
          )}

          {/* Dynamic Menus */}
          {tabs.length > 0 ? (
            renderMenuTree(tabs)
          ) : (
            <div className="text-center text-gray-400 text-xs py-8">
              No menus configured
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="px-4 pb-4 border-t">
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/login");
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white bg-gradient-to-r from-[#c63bff] to-[#e34bff] hover:opacity-90 transition font-medium"
          >
            <Logout /> Logout
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
