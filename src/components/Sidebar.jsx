// src/components/Sidebar.jsx
import React, { useState, useEffect, useContext, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Dashboard,
  Logout,
  ExpandMore,
  Business,
  Menu as MenuIcon,
  Close as CloseIcon,
  Domain,
  Group,
  ChevronLeft,
  ChevronRight,
  Folder,
  Description,
} from "@mui/icons-material";
import {
  Divider,
  IconButton,
  Popper,
  Paper,
  ClickAwayListener,
} from "@mui/material";
import { AuthContext } from "../context/AuthContext";
import { MenuContext } from "../context/MenuContext";

const Sidebar = ({ collapsed = false, onToggleCollapse }) => {
  const { user } = useContext(AuthContext);
  const { menus } = useContext(MenuContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [openSubmenus, setOpenSubmenus] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Fly-out state */
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  /* SAFE TABS */
  const tabs = useMemo(() => {
    if (!menus || !Array.isArray(menus.tabs)) return [];
    return menus.tabs;
  }, [menus]);

  /* AUTO-OPEN ACTIVE PARENTS (EXPANDED MODE ONLY) */
  useEffect(() => {
    if (!tabs.length) return;
    if (collapsed) return; // ❗ skip during collapse animation

    const openParents = {};
    const scan = (list, parentIds = []) => {
      list.forEach((menu) => {
        const path = `/${user?.role}/${menu.id}`;
        if (location.pathname.startsWith(path)) {
          parentIds.forEach((id) => (openParents[id] = true));
          if (menu.children?.length) openParents[menu.id] = true;
        }
        if (menu.children?.length) {
          scan(menu.children, [...parentIds, menu.id]);
        }
      });
    };

    scan(tabs);
    setOpenSubmenus(openParents);
  }, [location.pathname, tabs, user?.role]); // ❗ removed `collapsed`

  /* CLOSE FLYOUT IMMEDIATELY ON COLLAPSE */
  useEffect(() => {
    if (collapsed) {
      setHoveredMenu(null);
      setAnchorEl(null);
    }
  }, [collapsed]);

  /* HELPERS */
  const toggleSubmenu = (id) => (e) => {
    e?.stopPropagation();
    setOpenSubmenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isActive = (menuId, parentPath = "") => {
    const fullPath = `/${user?.role}${parentPath}/${menuId}`;
    return location.pathname.startsWith(fullPath);
  };

  const getDynamicIcon = (menu) =>
    menu.children?.length ? (
      <Folder fontSize="small" />
    ) : (
      <Description fontSize="small" />
    );

  const openFlyout = (event, menuId) => {
    if (!collapsed) return;
    setAnchorEl(event.currentTarget);
    setHoveredMenu(menuId);
  };

  const closeFlyout = () => {
    setAnchorEl(null);
    setHoveredMenu(null);
  };

  /* -------------------------------------------------------
     RECURSIVE MENU RENDERER (UNCHANGED UI)
  -------------------------------------------------------- */
  const renderMenuTree = (list, level = 0, parentPath = "") => {
    if (!Array.isArray(list)) return null;

    return list.map((menu) => {
      const currentPath = `${parentPath}/${menu.id}`;
      const fullPath = `/${user?.role}${currentPath}`;
      const hasChildren = menu.children?.length > 0;
      const isOpen = openSubmenus[menu.id];
      const active = isActive(menu.id, parentPath);

      return (
        <div key={menu.id} className="flex flex-col w-full">
          <div
            onMouseEnter={(e) =>
              collapsed && hasChildren && openFlyout(e, menu.id)
            }
          >
            <div
              className={`rounded-xl ${
                active
                  ? "bg-gradient-to-r from-[#c63bff1a] to-[#e34bff1a]"
                  : "hover:bg-[#faf5ff]"
              }`}
            >
              <div
                onClick={() => {
                  if (hasChildren && !collapsed) toggleSubmenu(menu.id)();
                  else {
                    navigate(fullPath);
                    setMobileOpen(false);
                  }
                }}
                className={`flex items-center justify-between cursor-pointer
                  ${collapsed ? "px-2 py-3 justify-center" : "px-4 py-3"}
                  text-[#c63bff]`}
                style={!collapsed ? { paddingLeft: 16 + level * 16 } : undefined}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {getDynamicIcon(menu)}
                  {!collapsed && (
                    <span className="text-sm truncate">{menu.title}</span>
                  )}
                </div>

                {hasChildren && !collapsed && (
                  <IconButton
                    size="small"
                    onClick={toggleSubmenu(menu.id)}
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
          </div>

          {/* Fly-out submenu (unchanged UI) */}
          {collapsed && hasChildren && hoveredMenu === menu.id && (
            <Popper
              open
              anchorEl={anchorEl}
              placement="right-start"
              style={{ zIndex: 2000 }}
            >
              <ClickAwayListener onClickAway={closeFlyout}>
                <Paper
                  onMouseEnter={() => setHoveredMenu(menu.id)}
                  onMouseLeave={closeFlyout}
                  className="relative min-w-[260px] rounded-2xl bg-white border border-[#eee]
                             shadow-[0_18px_40px_-12px_rgba(161,0,255,0.45)]"
                >
                  <div className="px-4 py-3 text-xs font-semibold text-[#7b2cbf] border-b">
                    {menu.title.toUpperCase()}
                  </div>

                  <div className="py-1 max-h-[320px] overflow-y-auto">
                    {menu.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => {
                          navigate(`/${user?.role}${currentPath}/${child.id}`);
                          closeFlyout();
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm
                                   text-[#5b2b82] hover:bg-[#faf5ff]"
                      >
                        {child.title}
                      </button>
                    ))}
                  </div>
                </Paper>
              </ClickAwayListener>
            </Popper>
          )}

          {hasChildren && isOpen && !collapsed && (
            <div>{renderMenuTree(menu.children, level + 1, currentPath)}</div>
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
      {/* Mobile toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <IconButton onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </IconButton>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed md:static z-40 h-screen bg-white flex flex-col
          shadow-[4px_0_15px_-4px_rgba(161,0,255,0.05)]
          transition-[width,transform] duration-300 ease-out
          will-change-[width,transform]
          ${collapsed ? "md:w-20" : "md:w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Collapse button */}
        <div className="hidden md:flex absolute top-1/2 -right-4 -translate-y-1/2 z-50">
          <button
            onClick={onToggleCollapse}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-[#c63bff] to-[#e34bff]
                       text-white flex items-center justify-center shadow-lg"
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
        </div>

        {/* Logo */}
        <div className="px-6 py-5 flex justify-center items-center gap-2 text-[#dc51f4] text-2xl font-bold">
          <Business />
          {!collapsed && <span>LOGO</span>}
        </div>

        <Divider />

        {/* Static Menus */}
        <div className="flex-1 overflow-y-auto px-2 pt-4 pb-2">
          <Link to={`${basePath}/dashboard`}>
            <button className="flex items-center gap-3 rounded-xl w-full px-4 py-3 text-[#c63bff] hover:bg-[#faf5ff] cursor-pointer">
              <Dashboard />
              {!collapsed && <span>Dashboard</span>}
            </button>
          </Link>

          {isAdmin && (
            <Link to={`${basePath}/menus`}>
              <button className=" cursor-pointer flex items-center gap-3 rounded-xl w-full px-4 py-3 text-[#c63bff] hover:bg-[#faf5ff]">
                <Business />
                {!collapsed && <span>Menu Manager</span>}
              </button>
            </Link>
          )}

          {isSuperAdmin && (
            <Link to={`${basePath}/organizations`}>
              <button  className="flex items-center gap-3 rounded-xl w-full px-4 py-3 text-[#c63bff] hover:bg-[#faf5ff] cursor-pointer">
                <Domain />
                {!collapsed && <span>Organizations</span>}
              </button>
            </Link>
          )}

          {isAdmin && (
            <Link to={`${basePath}/users`}>
              <button className="flex items-center gap-3 rounded-xl w-full px-4 py-3 text-[#c63bff] hover:bg-[#faf5ff] cursor-pointer">
                <Group />
                {!collapsed && <span>User Management</span>}
              </button>
            </Link>
          )}

          <Divider className="my-4" />

          {tabs.length ? renderMenuTree(tabs) : null}
        </div>

        {/* Logout */}
        <div className="px-4 pb-4 border-t">
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/login");
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
              text-white bg-gradient-to-r from-[#c63bff] to-[#e34bff]"
          >
            <Logout />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

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
