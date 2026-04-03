"use client";

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface BarChartProps {
  data: any[];
  groupBy: string;
  valueKey: string;
}

export default function BarChart({ data, groupBy, valueKey }: BarChartProps) {
  const grouped = data.reduce((acc: any, item: any) => {
    const key = item.user?.role || item[groupBy];
    if (!acc[key]) acc[key] = { count: 0, sum: 0 };
    acc[key].count++;
    acc[key].sum += item[valueKey];
    return acc;
  }, {});

  const chartData = Object.entries(grouped).map(([name, { sum, count }]: [string, any]) => ({
    name,
    avg: sum / count,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, 5]} />
        <Tooltip />
        <Legend />
        <Bar dataKey="avg" fill="#182E3E" name="Average Rating" />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}