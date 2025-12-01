import StatCard from "../components/StatCard";
import RevenueChart from "../components/RevenueChart";
import TopOrgs from "../components/TopOrgs";
import { MdGroups, MdAdminPanelSettings, MdPeople } from "react-icons/md";
import {MenuContext} from "../context/MenuContext"; 


const Dashboard = () => (
  <div className="flex-1 p-6 bg-gradient-to-br from-purple-50 to-white min-h-screen">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      <StatCard
        title="Total Organisations"
        value="40"
        color="pink"
        icon={MdGroups}
      />
      <StatCard
        title="Total Admins"
        value="40"
        color="blue"
        icon={MdAdminPanelSettings}
      />
      <StatCard
        title="Total Users"
        value="40"
        color="orange"
        icon={MdPeople}
      />
    </div>

    <RevenueChart />
    <TopOrgs />
  </div>
);

export default Dashboard;
