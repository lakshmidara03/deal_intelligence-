"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { name: "Email", positive: 62, neutral: 24, negative: 14 },
  { name: "Calls", positive: 48, neutral: 30, negative: 22 },
  { name: "Meetings", positive: 70, neutral: 20, negative: 10 }
];

export function SentimentChart() {
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip contentStyle={{ borderRadius: 8 }} />
          <Bar dataKey="positive" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="neutral" stackId="a" fill="#06b6d4" />
          <Bar dataKey="negative" stackId="a" fill="#f43f5e" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
