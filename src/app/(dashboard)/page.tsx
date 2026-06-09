import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { dashboardService } from "@/features/dashboard/services/dashboard-service"
import { DashboardPageContent } from "@/features/dashboard/components/dashboard-page-content"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const isArtist = session.user.role === "Artist"
  const userId = isArtist ? session.user.id : undefined

  const [metrics, taskStatusDistribution, projectStatusDistribution, recentTasks] =
    await Promise.all([
      dashboardService.getMetrics(userId),
      dashboardService.getTaskStatusDistribution(userId),
      dashboardService.getProjectStatusDistribution(),
      dashboardService.getRecentTasks(userId),
    ])

  return (
    <DashboardPageContent
      metrics={metrics}
      taskStatusDistribution={taskStatusDistribution}
      projectStatusDistribution={projectStatusDistribution}
      recentTasks={recentTasks}
    />
  )
}
