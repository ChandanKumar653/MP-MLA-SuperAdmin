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
  Domain, // Icon for Organization Manager
} from "@mui/icons-material";
import { Divider, Tooltip, IconButton } from "@mui/material";
import { AuthContext } from "../context/AuthContext";
import { MenuContext } from "../context/MenuContext";

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const { menus: rawMenus, setMenus } = useContext(MenuContext);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Safe menu parsing
  const menus = useMemo(() => {
    if (Array.isArray(rawMenus)) return rawMenus;
    if (typeof rawMenus === "string" && rawMenus.trim()) {
      try {
        const parsed = JSON.parse(rawMenus);
        setMenus(parsed);
        return parsed;
      } catch (e) {
        console.error("Invalid menuTree JSON:", e);
        return [];
      }
    }
    return [];
  }, [rawMenus, setMenus]);

  // Auto-open active parent menus
  useEffect(() => {
    const openParents = {};
    const scan = (items, parentIds = []) => {
      items.forEach((menu) => {
        const path = `/${user?.role}/${menu.id}`;
        if (location.pathname.startsWith(path)) {
          parentIds.forEach(id => (openParents[id] = true));
          if (menu.children?.length > 0) openParents[menu.id] = true;
        }
        if (menu.children?.length > 0) {
          scan(menu.children, [...parentIds, menu.id]);
        }
      });
    };
    if (menus.length > 0) scan(menus);
    setOpenSubmenus(prev => ({ ...prev, ...openParents }));
  }, [location.pathname, menus, user?.role]);

  const toggleSubmenu = (id) => (e) => {
    e?.stopPropagation();
    setOpenSubmenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isActive = (menuId, parentPath = "") => {
    const fullPath = `/${user?.role}${parentPath}/${menuId}`;
    return location.pathname.startsWith(fullPath);
  };

  const renderMenuTree = (list, level = 0, parentPath = "") => {
    if (!Array.isArray(list)) return null;

    return list.map((menu) => {
      const currentPath = `${parentPath}/${menu.id}`;
      const fullPath = `/${user?.role}${currentPath}`;
      const hasChildren = menu.children && menu.children.length > 0;
      const isOpen = openSubmenus[menu.id] || false;
      const active = isActive(menu.id, parentPath);

      return (
        <div key={menu.id} className="flex flex-col w-full">
          <div
            className={`w-full transition-all duration-200 ${
              active
                ? level > 0
                  ? "bg-gradient-to-r from-[#c63bff0d] to-[#e34bff0d]"
                  : "bg-gradient-to-r from-[#c63bff1a] to-[#e34bff1a] shadow-sm"
                : "hover:bg-[#faf5ff]"
            } rounded-xl`}
          >
            <div
              className={`flex items-center justify-between w-full px-4 py-3 cursor-pointer text-left transition-all duration-300 ${
                active ? "text-[#c63bff] font-medium" : "text-[#c63bff]"
              }`}
              style={{ paddingLeft: `${16 * (level + 1)}px` }}
              onClick={() => {
                if (hasChildren) {
                  toggleSubmenu(menu.id)();
                } else {
                  navigate(fullPath);
                  setMobileOpen(false);
                }
              }}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {menu.hasForm && (
                  <Brightness1 style={{ fontSize: 8, color: "#c63bff" }} />
                )}
                <Tooltip title={menu.title || "Untitled"} arrow placement="right">
                  <span className="text-sm font-medium truncate">
                    {menu.title || "Untitled"}
                  </span>
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

  const basePath = `/${user?.role}`;
  const isAdmin = user?.role === "admin";
  const isSuperAdmin = user?.role === "superadmin";

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <IconButton onClick={() => setMobileOpen(!mobileOpen)} sx={{ color: "#a100ff" }}>
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </IconButton>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed md:static z-40 h-screen w-64 bg-white flex flex-col justify-between transition-transform duration-300
          shadow-[4px_0_15px_-4px_rgba(161,0,255,0.05)] border-none
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="px-6 py-5 flex justify-center items-center gap-2 text-[#dc51f4] text-2xl font-bold">
          <Business /> LOGO
        </div>
        <Divider />

        {/* Menu Content */}
        <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4 scrollbar-hide">
          {/* Dashboard - All Roles */}
          <Link to={`${basePath}/dashboard`} onClick={() => setMobileOpen(false)}>
            <button className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-sm font-medium transition-all duration-300 cursor-pointer ${
              location.pathname === `${basePath}/dashboard`
                ? "bg-gradient-to-r from-[#c63bff1a] to-[#e34bff1a] text-[#c63bff]"
                : "text-[#c63bff] hover:bg-[#faf5ff]"
            }`}>
              <Dashboard />
              <Tooltip title="Dashboard" arrow placement="right">
                <span className="truncate">Dashboard</span>
              </Tooltip>
            </button>
          </Link>

          {/* Admin Only: Menu Manager */}
          {isAdmin && (
            <Link to={`${basePath}/menus`} onClick={() => setMobileOpen(false)}>
              <button className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-sm font-medium transition-all duration-300 cursor-pointer ${
                location.pathname === `${basePath}/menus`
                  ? "bg-gradient-to-r from-[#c63bff1a] to-[#e34bff1a] text-[#c63bff]"
                  : "text-[#c63bff] hover:bg-[#faf5ff]"
              }`}>
                <Business />
                <Tooltip title="Menu Manager" arrow placement="right">
                  <span className="truncate">Menu Manager</span>
                </Tooltip>
              </button>
            </Link>
          )}

          {/* SuperAdmin Only: Organization Manager */}
          {isSuperAdmin && (
            <Link to={`${basePath}/organizations`} onClick={() => setMobileOpen(false)}>
              <button className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-sm font-medium transition-all duration-300 cursor-pointer ${
                location.pathname.includes(`${basePath}/organizations`)
                  ? "bg-gradient-to-r from-[#c63bff1a] to-[#e34bff1a] text-[#c63bff]"
                  : "text-[#c63bff] hover:bg-[#faf5ff]"
              }`}>
                <Domain />
                <Tooltip title="Organizations" arrow placement="right">
                  <span className="truncate">Organizations</span>
                </Tooltip>
              </button>
            </Link>
          )}

          <Divider className="my-4" />

          {/* Dynamic Menus - All Roles */}
          {menus.length > 0 ? (
            renderMenuTree(menus)
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
              localStorage.removeItem("user");
              localStorage.removeItem("menuTree");
              navigate("/login");
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white bg-gradient-to-r from-[#c63bff] to-[#e34bff] hover:opacity-90 transition font-medium"
          >
            <Logout /> Logout
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
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