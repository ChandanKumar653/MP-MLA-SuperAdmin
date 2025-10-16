import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Dashboard,
  Logout,
  ExpandMore,
  Business,
  Brightness1,
  Menu as MenuIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { Divider, Tooltip, IconButton } from "@mui/material";
import { AuthContext } from "../context/AuthContext";
import { MenuContext } from "../context/MenuContext";

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const { menus, setMenus } = useContext(MenuContext);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("menuTree");
    if (saved) setMenus(JSON.parse(saved));
  }, [setMenus]);

  const toggleSubmenu = (id) =>
    setOpenSubmenus((prev) => ({ ...prev, [id]: !prev[id] }));

  const isMenuActive = (menu, currentPath, parentPath = `/${user?.role}`) => {
    const path = `${parentPath}/${menu.id}`;
    if (path === currentPath) return true;
    if (menu.children?.length > 0) {
      return menu.children.some((child) =>
        isMenuActive(child, currentPath, path)
      );
    }
    return false;
  };

  const renderMenuTree = (list, level = 0, parentPath = `/${user?.role}`) =>
    list.map((menu) => {
      const path = `${parentPath}/${menu.id}`;
      const active = isMenuActive(menu, location.pathname, parentPath);
      const isSubmenu = level > 0;
      const open = openSubmenus[menu.id] || active;

      return (
        <div key={menu.id} className="flex flex-col w-full">
          <div
            className={`w-full transition-all duration-200 ${
              active
                ? isSubmenu
                  ? "bg-gradient-to-r from-[#c63bff0d] to-[#e34bff0d]"
                  : "bg-gradient-to-r from-[#c63bff1a] to-[#e34bff1a] shadow-sm"
                : "hover:bg-[#faf5ff]"
            } rounded-xl`}
          >
            <div
              className={`flex items-center justify-between w-full px-4 py-3 cursor-pointer text-left transition-all duration-300 ${
                active
                  ? "text-[#c63bff] font-medium"
                  : "text-[#c63bff] hover:text-[#c63bff]"
              }`}
              style={{ paddingLeft: `${16 * (level + 1)}px` }}
              onClick={() => {
                if (menu.children?.length > 0) {
                  toggleSubmenu(menu.id);
                } else {
                  navigate(path);
                  setMobileOpen(false); // close sidebar on mobile
                }
              }}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {menu.hasForm && (
                  <Brightness1 style={{ fontSize: 8, color: "#c63bff" }} />
                )}
                <Tooltip
                  title={menu.title || "(Untitled Menu)"}
                  arrow
                  placement="right"
                >
                  <span className="text-sm font-medium truncate">
                    {menu.title || "(Untitled Menu)"}
                  </span>
                </Tooltip>
              </div>

              {menu.children?.length > 0 && (
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSubmenu(menu.id);
                  }}
                  size="small"
                  sx={{
                    color: "#c63bff",
                    transform: open ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.3s",
                  }}
                >
                  <ExpandMore fontSize="small" />
                </IconButton>
              )}
            </div>
          </div>

          {menu.children?.length > 0 && open && (
            <div className="transition-all duration-300">
              {renderMenuTree(menu.children, level + 1, path)}
            </div>
          )}
        </div>
      );
    });

  return (
    <>
      {/* Mobile toggle button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <IconButton
          onClick={() => setMobileOpen(!mobileOpen)}
          sx={{ color: "#a100ff" }}
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </IconButton>
      </div>

      {/* Sidebar container */}
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

        {/* Scrollable menu container */}
        <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4 scrollbar-hide curp">
          {/* Dashboard */}
          <Link
            to={`/${user?.role}/dashboard`}
            className="w-full"
            onClick={() => setMobileOpen(false)}
          >
            <button
              className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-sm font-medium transition-all duration-300 cursor-pointer ${
                location.pathname === `/${user?.role}/dashboard`
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

          {/* Menu Manager */}
          <Link
            to={`/${user?.role}/menus`}
            className="w-full"
            onClick={() => setMobileOpen(false)}
          >
            <button
              className={`flex cursor-pointer items-center gap-3 px-4 py-3 rounded-xl w-full text-sm font-medium transition-all duration-300 ${
                location.pathname === `/${user?.role}/menus`
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

          {/* Dynamic menus */}
          {menus.length > 0 && renderMenuTree(menus)}
        </div>

        {/* Logout button always at bottom */}
        <div className="px-4 pb-4">
          <button
            onClick={() => {
              localStorage.removeItem("user");
              localStorage.removeItem("menuTree");
              window.location.href = "/login";
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white bg-gradient-to-r from-[#c63bff] to-[#e34bff] hover:opacity-90 transition"
          >
            <Logout /> Logout
          </button>
        </div>
      </div>

      {/* Backdrop overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
