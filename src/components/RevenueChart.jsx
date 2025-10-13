import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Org A", revenue: 70 },
  { name: "Org B", revenue: 50 },
  { name: "Org C", revenue: 40 },
  { name: "Org D", revenue: 20 },
  { name: "Org E", revenue: 45 },
  { name: "Org F", revenue: 10 },
  { name: "Org G", revenue: 35 },
  { name: "Org H", revenue: 90 },
  { name: "Org I", revenue: 40 },
  { name: "Org J", revenue: 45 },
  { name: "Org K", revenue: 60 },
  { name: "Org L", revenue: 15 },
  { name: "Org M", revenue: 90 },
  { name: "Org N", revenue: 40 },
  { name: "Org O", revenue: 55 },
  { name: "Org P", revenue: 90 },
  { name: "Org Q", revenue: 20 },
];

const RevenueChart = () => (
  <div className="bg-white rounded-2xl p-4 shadow-sm mt-4">
    <h3 className="font-semibold mb-2 text-purple-700">Revenue Overview</h3>
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="revenue" fill="#a855f7" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default RevenueChart;
