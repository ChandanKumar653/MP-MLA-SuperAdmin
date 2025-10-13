// import React from "react";
// import Sidebar from "../components/Sidebar";
// import Topbar from "../components/Topbar";
// import { Outlet } from "react-router-dom";

// const Layout = ({ role, sidebarItems, topbarData }) => {
//   return (
//     <div className="flex h-screen bg-gray-50">
//       {/* Sidebar */}
//       <div className="w-64 fixed top-0 left-0 h-full bg-white shadow-md z-20">
//         <Sidebar role={role} items={sidebarItems} />
//       </div>

//       {/* Main area */}
//       <div className="flex flex-col flex-1 ml-64 overflow-y-auto">
//         <div className="sticky top-0 z-10 bg-white shadow-sm">
//           <Topbar role={role} data={topbarData} />
//         </div>

//         <main className="p-6">
//           {/* Nested child routes render here */}
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// };

// export default Layout;


import React from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Outlet } from "react-router-dom";

const Layout = ({ role }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 fixed top-0 left-0 h-full bg-white shadow-md z-20">
        <Sidebar role={role} />
      </div>

      <div className="flex flex-col flex-1 ml-64 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white shadow-sm">
          <Topbar role={role} />
        </div>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
