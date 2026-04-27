import { Outlet, createFileRoute } from "@tanstack/react-router"

import { AppSidebar } from "@/components/sidebar/appSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ScreenShell } from "@/components/layout/screenShell"

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <ScreenShell className="bg-sidebar">
      <SidebarProvider defaultOpen>
        <div className="flex">
          <AppSidebar />
        <div className="min-h-dvh flex-1">
          <Outlet />
        </div>
        </div>
      </SidebarProvider>
    </ScreenShell>
  )
}
