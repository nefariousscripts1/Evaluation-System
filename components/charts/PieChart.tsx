"use client";

import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface PieChartProps {
  data: any[];
  valueKey: string;
}

export default function PieChart({ data, valueKey }: PieChartProps) {
  const ratingRanges = {
    "1-2 stars": 0,
    "2-3 stars": 0,
    "3-4 stars": 0,
    "4-5 stars": 0,
  };

  data.forEach((item) => {
    const rating = item[valueKey];
    if (rating <= 2) ratingRanges["1-2 stars"]++;
    else if (rating <= 3) ratingRanges["2-3 stars"]++;
    else if (rating <= 4) ratingRanges["3-4 stars"]++;
    else ratingRanges["4-5 stars"]++;
  });

  const chartData = Object.entries(ratingRanges).map(([range, count]) => ({
    name: range,
    value: count,
  }));

  const COLORS = ["#FF6B6B", "#FFA500", "#FFD700", "#4CAF50"];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsPieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
