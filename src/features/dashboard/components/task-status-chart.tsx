"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { StatusDistribution } from "@/features/dashboard/services/dashboard-service"

const STATUS_COLORS: Record<string, string> = {
  TODO: "#94a3b8",
  IN_PROGRESS: "#3b82f6",
  REVIEW: "#f59e0b",
  COMPLETE: "#22c55e",
}

const STATUS_LABELS: Record<string, string> = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  COMPLETE: "Complete",
}

interface TaskStatusChartProps {
  data: StatusDistribution[]
}

export function TaskStatusChart({ data }: TaskStatusChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    name: STATUS_LABELS[d.name] || d.name,
    fill: STATUS_COLORS[d.name] || "#94a3b8",
  }))

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-medium">Task Status Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              dataKey="value"
              nameKey="name"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
