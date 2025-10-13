import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { Dashboard, Logout, ExpandMore, ExpandLess, Business, Brightness1 } from "@mui/icons-material";
import { Divider, Tooltip } from "@mui/material";
import { AuthContext } from "../context/AuthContext";

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const [menus, setMenus] = useState([]);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const location = useLocation();

  useEffect(() => {
    const saved = localStorage.getItem("menuTree");
    if (saved) setMenus(JSON.parse(saved));
  }, []);

  const toggleSubmenu = (id) =>
    setOpenSubmenus((prev) => ({ ...prev, [id]: !prev[id] }));

  const isMenuActive = (menu, currentPath, parentPath = "/superadmin") => {
    const path = `${parentPath}/${menu.id}`;
    if (path === currentPath) return true;
    if (menu.children?.length > 0) {
      return menu.children.some((child) =>
        isMenuActive(child, currentPath, path)
      );
    }
    return false;
  };

  const renderMenuTree = (list, level = 0, parentPath = "/superadmin") =>
    list.map((menu) => {
      const path = `${parentPath}/${menu.id}`;
      const active = isMenuActive(menu, location.pathname, parentPath);
      const isSubmenu = level > 0;

      return (
        <div key={menu.id} className="flex flex-col">
          <Link to={path}>
            <button
              onClick={() => menu.children?.length > 0 && toggleSubmenu(menu.id)}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-left transition-all duration-300 ${
                active
                  ? isSubmenu
                    ? "bg-purple-100 text-purple-700 border-l-4 border-purple-400 pl-3"
                    : "bg-gradient-to-r from-purple-300 to-purple-400 text-white shadow-md"
                  : "text-gray-700 hover:bg-purple-50"
              }`}
              style={{ paddingLeft: `${16 * (level + 1)}px` }}
            >
              <div className="flex items-center gap-3">
                {menu.hasForm && <span><Brightness1/></span>}
                <span>{menu.title || "(Untitled Menu)"}</span>
              </div>
              {menu.children?.length > 0 && (
                <span
                  className={`transition-transform duration-300 ${
                    openSubmenus[menu.id] || active ? "rotate-180" : "rotate-0"
                  }`}
                >
                  <ExpandMore />
                </span>
              )}
            </button>
          </Link>

          {menu.children?.length > 0 &&
            (openSubmenus[menu.id] || active) &&
            <div className="transition-all duration-300">
              {renderMenuTree(menu.children, level + 1, path)}
            </div>
          }
        </div>
      );
    });

  return (
    <div className="flex flex-col h-full justify-between bg-white shadow-xl">
      <div>
        <div className="text-[#cb0b96] text-2xl font-bold px-6 py-5 flex justify-center items-center">
          LOGO
        </div>
        <Divider />

        <nav className="flex flex-col px-4 gap-2 pt-6">
          {/* Dashboard always */}
          <Link to="/superadmin/dashboard">
            <button
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 transition-all duration-300 ${
                location.pathname === "/superadmin/dashboard"
                  ? "bg-gradient-to-r from-purple-300 to-purple-400 text-white shadow-md"
                  : "hover:bg-purple-50"
              }`}
            >
              <Dashboard />
              <Tooltip title="Dashboard" arrow placement="right">
                <span className="text-sm font-medium truncate">Dashboard</span>
              </Tooltip>
            </button>
          </Link>

          <Link to="/superadmin/menus">
            <button
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 transition-all duration-300 ${
                location.pathname === "/superadmin/menus"
                  ? "bg-gradient-to-r from-purple-300 to-purple-400 text-white shadow-md"
                  : "hover:bg-purple-50"
              }`}
            >
              <Business />
              <Tooltip title="Menu Manager" arrow placement="right">
                <span className="text-sm font-medium truncate">Menu Manager</span>
              </Tooltip>
            </button>
          </Link>

          {/* Dynamic menus */}
          {menus.length > 0 && renderMenuTree(menus)}
        </nav>
      </div>

      <div className="p-4">
        <button
          onClick={() => {
            localStorage.removeItem("user");
            localStorage.removeItem("menuTree");
            window.location.href = "/login";
          }}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:opacity-90 transition"
        >
          <Logout /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;




// import {
//   Dashboard,
//   Business,
//   Settings,
//   People,
//   AccountCircle,
//   Logout,
// } from "@mui/icons-material";
// import { Divider } from "@mui/material";
// import { useState } from "react";
// import { Tooltip } from "@mui/material";
// import { Link } from "react-router-dom";
// import { AuthContext } from "../context/AuthContext";
// import { useContext } from "react";
// import { useNavigate } from "react-router-dom";
// const Sidebar = () => {
//   const naviate=useNavigate();
//   const [active, setActive] = useState("Dashboard");
//   const { user } = useContext(AuthContext);
//   console.log("user", user);

//   const menuItems = [
//     { name: "Dashboard", icon: <Dashboard fontSize="small" /> },
//     { name: "Menus", icon: <Business fontSize="small" /> },
//     { name: "Organisation Management", icon: <Business fontSize="small" /> },
//     { name: "Global Settings", icon: <Settings fontSize="small" /> },
//     { name: "User/Admin Management", icon: <People fontSize="small" /> },
//     { name: "Profile", icon: <AccountCircle fontSize="small" /> },
//   ];

//   const handleLogout=async()=>{
//     localStorage.removeItem("user");
//     localStorage.removeItem("menuTree");
//     naviate("/")
//   }
//   return (
//     <div className="w-64 bg-white h-screen flex flex-col justify-between shadow-xl rounded-r-2xl">
//       <div>
//         <div className="text-[#cb0b96]  text-2xl font-bold px-6 py-5 tracking-wide flex justify-center items-center">
//           LOGO
//         </div>
//         <Divider />

//         <nav className="flex flex-col px-4 gap-2 pt-6">
//           {menuItems?.map((item) => {
//             const isActive = item.name === active;
//             const pathName = item.name
//               .toLowerCase()
//               .replace(/\s+/g, "-")
//               .replace(/\//g, "-"); 

//             <Link to={`/${user?.role}/${pathName}`}>...</Link>;

//             return (
//               <>
//                 <Link
//                   key={item?.name}
//                   to={`/${user?.role}/${item.name
//                     .toLowerCase()
//                     .replace(/\s+/g, "-")}`}
//                 >
//                   <button
//                     onClick={() => setActive(item.name)}
//                     className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
//                       isActive
//                         ? "bg-gradient-to-r from-purple-300 to-purple-400  text-white shadow-md scale-[1.02]"
//                         : "text-gray-700 hover:bg-purple-50 hover:text-purple-600"
//                     }`}
//                   >
//                     <span
//                       className={`transition-colors shrink-0 ${
//                         isActive ? "text-white" : "text-purple-500"
//                       }`}
//                     >
//                       {item.icon}
//                     </span>
//                     <Tooltip title={item.name} arrow placement="right">
//                       <span className="text-sm font-medium truncate whitespace-nowrap overflow-hidden text-ellipsis">
//                         {item.name}
//                       </span>
//                     </Tooltip>
//                   </button>
//                 </Link>
//               </>
//             );
//           })}
//         </nav>
//       </div>

//       <div className="p-4">
//         <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:opacity-90 transition">
//           <Logout fontSize="small" /> Logout
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Sidebar;
