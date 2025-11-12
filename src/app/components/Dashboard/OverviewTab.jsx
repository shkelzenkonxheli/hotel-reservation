import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function OverviewTab() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchOverview();
  }, []);

  async function fetchOverview() {
    const res = await fetch("/api/dashboard");
    const data = await res.json();
    setStats(data);
  }
  if (!stats)
    return <p className="text-center text-gray-500">Loading dashboard...</p>;
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Users */}
        <div className="bg-blue-600 text-white p-6 rounded-xl shadow text-center">
          <h3 className="text-lg font-medium">Total Users</h3>
          <p className="text-4xl font-bold mt-2">{stats?.totalUsers ?? 0}</p>
        </div>

        {/* Total Reservations */}
        <div className="bg-green-600 text-white p-6 rounded-xl shadow text-center">
          <h3 className="text-lg font-medium">Total Reservations</h3>
          <p className="text-4xl font-bold mt-2">
            {stats?.totalReservation ?? 0}
          </p>
        </div>

        {/* Total Earnings */}
        <div className="bg-yellow-500 text-white p-6 rounded-xl shadow text-center">
          <h3 className="text-lg font-medium">Total Earnings</h3>
          <p className="text-4xl font-bold mt-2">
            €{stats?.totalEarnings?.toFixed(2) ?? "0.00"}
          </p>
        </div>
      </div>
    </div>
  );
}
