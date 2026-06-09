"use client"

import { FolderKanban, ListTodo, Package, Clapperboard } from "lucide-react"
import { MetricCard } from "./metric-card"
import { TaskStatusChart } from "./task-status-chart"
import { ProjectStatusChart } from "./project-status-chart"
import { RecentTasksTable } from "./recent-tasks-table"
import type {
  DashboardMetrics,
  StatusDistribution,
  RecentTaskItem,
} from "@/features/dashboard/services/dashboard-service"

interface DashboardPageContentProps {
  metrics: DashboardMetrics
  taskStatusDistribution: StatusDistribution[]
  projectStatusDistribution: StatusDistribution[]
  recentTasks: RecentTaskItem[]
}

export function DashboardPageContent({
  metrics,
  taskStatusDistribution,
  projectStatusDistribution,
  recentTasks,
}: DashboardPageContentProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Production overview and metrics.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Projects"
          value={metrics.totalProjects}
          icon={FolderKanban}
        />
        <MetricCard
          title="Open Tasks"
          value={metrics.openTasks}
          icon={ListTodo}
          description={
            metrics.overdueTasks > 0
              ? `${metrics.overdueTasks} overdue`
              : undefined
          }
        />
        <MetricCard
          title="Active Assets"
          value={metrics.activeAssets}
          icon={Package}
        />
        <MetricCard
          title="Active Shots"
          value={metrics.activeShots}
          icon={Clapperboard}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TaskStatusChart data={taskStatusDistribution} />
        <ProjectStatusChart data={projectStatusDistribution} />
      </div>

      <RecentTasksTable tasks={recentTasks} />
    </div>
  )
}
