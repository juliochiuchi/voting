import { Link, useNavigate, useRouterState } from "@tanstack/react-router"
import {
  ClipboardList,
  Crown,
  Languages,
  LogOut,
  PanelLeft,
  Trophy,
  UserCheck,
  Users,
  Vote,
} from "lucide-react"
import { useEffect, useState } from "react"

import { ConfirmActionModal } from "@/components/modal/confirmActionModal"
import ipibIcon from "@/assets/IPIB-icon.png"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

  const profileName = user?.name ?? user?.firstName ?? "Administrador"
  const profileInitials = profileName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .trim()

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
        <div className={open ? "flex min-w-0 flex-1 items-center gap-3" : "flex flex-col items-center gap-2"}>
          {isSidebarLoading ? (
            <Skeleton className="size-10 rounded-2xl" />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Abrir menu do perfil"
                  className="relative grid size-10 cursor-pointer place-items-center rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  <Avatar className="size-10">
                    <AvatarImage src={ipibIcon} alt="IPIB" />
                    <AvatarFallback>{profileInitials || "AD"}</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-black/35" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={open ? "start" : "center"}
                side="bottom"
                className="w-[240px]"
              >
                <DropdownMenuItem disabled>
                  <Languages className="size-4" />
                  Idioma
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault()
                    setIsLogoutConfirmOpen(true)
                  }}
                >
                  <LogOut className="size-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

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
        <div className={open ? "px-4 pb-4" : "px-2 pb-4"} />
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
