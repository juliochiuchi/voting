import { Link, useNavigate, useRouterState } from "@tanstack/react-router"
import {
  ClipboardList,
  Crown,
  LogOut,
  PanelLeft,
  Trophy,
  UserCheck,
  Users,
  Vote,
} from "lucide-react"
import { useEffect, useState } from "react"

import { ConfirmActionModal } from "@/components/modal/confirmActionModal"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuthUser } from "@/contexts/authUserContext"

type SidebarItem = {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
}

const sidebarItems: SidebarItem[] = [
  { label: "Eleitos", to: "/elected", icon: Trophy },
  { label: "Eleições", to: "/election", icon: Crown },
  { label: "Rodada", to: "/round", icon: ClipboardList },
  { label: "Votos", to: "/votes", icon: Vote },
  { label: "Membros", to: "/members", icon: Users },
  { label: "Registro de votos", to: "/vote-registry", icon: UserCheck },
]

export function AppSidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const navigate = useNavigate()
  const { user, clearUser } = useAuthUser()
  const { open } = useSidebar()
  const [isSidebarLoading, setIsSidebarLoading] = useState(true)
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)

  const isElectedHomeActive = pathname === "/elected" || pathname === "/elected/"

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsSidebarLoading(false), 220)
    return () => window.clearTimeout(timeoutId)
  }, [])

  return (
    <Sidebar>
      <SidebarHeader
        className={
          open
            ? "flex items-center gap-2 px-4 py-4"
            : "flex flex-col items-center gap-2 px-2 py-4"
        }
      >
        <div className={open ? "flex min-w-0 flex-1 items-center gap-3" : ""}>
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10">
            <Crown className="size-5" />
          </div>
          {isSidebarLoading ? (
            <div className="min-w-0 leading-tight group-data-[state=closed]/sidebar:hidden">
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="mt-2 h-3 w-36 rounded-full" />
            </div>
          ) : (
            <div className="min-w-0 leading-tight group-data-[state=closed]/sidebar:hidden animate-in fade-in-0 slide-in-from-left-1 duration-300">
              <div className="truncate text-sm font-semibold tracking-tight">
                Gerenciar Eleições
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {user?.name ? `Olá, ${user.name}` : "Área do administrador"}
              </div>
            </div>
          )}
        </div>

        <SidebarTrigger aria-label="Alternar sidebar">
          <PanelLeft className="size-4" />
        </SidebarTrigger>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu
          className={!isSidebarLoading ? "animate-in fade-in-0 slide-in-from-left-1 duration-300" : undefined}
        >
          {isSidebarLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <SidebarMenuItem key={index}>
                <div className="flex items-center gap-3 px-3 py-2">
                  <Skeleton className="h-8 w-8 rounded-2xl" />
                  <Skeleton className="h-4 w-28 rounded-full group-data-[state=closed]/sidebar:hidden" />
                </div>
              </SidebarMenuItem>
            ))
          ) : (
            sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive =
                item.to === "/elected"
                  ? isElectedHomeActive
                  : pathname === item.to

              return (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link to={item.to}>
                      <Icon className="size-4" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        {isSidebarLoading ? (
          <div className={open ? "" : "flex justify-center"}>
            <Skeleton className={open ? "h-10 w-full rounded-2xl" : "h-8 w-8 rounded-2xl"} />
          </div>
        ) : open ? (
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2 rounded-2xl bg-background/15 hover:bg-background/25"
            onClick={() => setIsLogoutConfirmOpen(true)}
          >
            <LogOut className="size-4" />
            Sair
          </Button>
        ) : (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Sair"
              className="rounded-2xl bg-background/15 hover:bg-background/25"
              onClick={() => setIsLogoutConfirmOpen(true)}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>

      <ConfirmActionModal
        open={isLogoutConfirmOpen}
        onOpenChange={setIsLogoutConfirmOpen}
        title="Sair"
        description="Tem certeza que deseja sair da área do administrador?"
        cancelLabel="Cancelar"
        confirmLabel="Sair"
        confirmVariant="destructive"
        onConfirm={() => {
          clearUser()
          navigate({ to: "/login", replace: true })
        }}
      />
    </Sidebar>
  )
}
