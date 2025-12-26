import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Outlet } from "react-router-dom";

const Layout = ({ role }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);   // mobile
  const [collapsed, setCollapsed] = useState(false);     // desktop shrink

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full bg-white z-20
          transform transition-transform duration-300 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          ${collapsed ? "md:w-20" : "md:w-64"}
        `}
      >
        <Sidebar
          role={role}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((p) => !p)}
        />
      </div>

      {/* Main Content */}
      <div
        className={`
          flex flex-col flex-1 min-w-0
          transition-[margin-left] duration-300 ease-out
          ${sidebarOpen ? "ml-64" : "ml-0"}
          ${collapsed ? "md:ml-20" : "md:ml-64"}
        `}
      >
        {/* Topbar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm">
          <Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        </div>

        {/* Page Content */}
        <main className="p-6 overflow-y-auto flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
