import { Outlet, createFileRoute } from "@tanstack/react-router"
import { PanelLeft } from "lucide-react"

import { AppSidebar } from "@/components/sidebar/appSidebar"
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { ScreenShell } from "@/components/layout/screenShell"

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardLayout,
})

function DashboardMobileTopbar() {
  const { open, setOpen } = useSidebar()

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-white/10 bg-sidebar/40 px-4 py-3 backdrop-blur-2xl lg:hidden">
        <div className="flex items-center gap-3">
          <SidebarTrigger aria-label="Abrir menu">
            <PanelLeft className="size-4" />
          </SidebarTrigger>
          <div className="text-sm font-medium text-foreground">Painel</div>
        </div>
      </div>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px] lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}
    </>
  )
}

function DashboardLayout() {
  return (
    <ScreenShell className="bg-sidebar">
      <SidebarProvider defaultOpen>
        <div className="lg:flex">
          <AppSidebar />
          <div className="min-h-dvh w-full lg:min-w-0 lg:flex-1">
            <DashboardMobileTopbar />
            <Outlet />
          </div>
        </div>
      </SidebarProvider>
    </ScreenShell>
  )
}
