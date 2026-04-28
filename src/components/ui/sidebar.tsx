import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

type SidebarContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(
  undefined,
)

export function SidebarProvider({
  defaultOpen = true,
  children,
}: {
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(() => {
    if (typeof window === "undefined") return defaultOpen
    return window.matchMedia("(min-width: 1024px)").matches ? defaultOpen : false
  })

  const toggle = React.useCallback(() => {
    setOpen((previousOpen) => !previousOpen)
  }, [])

  const value = React.useMemo<SidebarContextValue>(
    () => ({ open, setOpen, toggle }),
    [open, toggle],
  )

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const value = React.useContext(SidebarContext)
  if (!value) {
    throw new Error("useSidebar must be used within SidebarProvider")
  }
  return value
}

export function Sidebar({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const { open } = useSidebar()

  return (
    <aside
      data-slot="sidebar"
      data-state={open ? "open" : "closed"}
      className={cn(
        "group/sidebar fixed inset-y-0 left-0 z-50 h-dvh w-[280px] shrink-0 border-r border-white/10 bg-sidebar/40 backdrop-blur-2xl transition-transform duration-300 lg:relative lg:z-auto lg:h-auto lg:min-h-dvh lg:translate-x-0 lg:transition-[width] lg:duration-300",
        open ? "translate-x-0 lg:w-[280px]" : "-translate-x-full lg:w-[72px]",
        className,
      )}
    >
      {children}
    </aside>
  )
}

export function SidebarHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("flex items-center gap-2 px-4 py-4", className)}
      {...props}
    />
  )
}

export function SidebarContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn("flex-1 overflow-auto px-3 pb-3", className)}
      {...props}
    />
  )
}

export function SidebarFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("px-4 pb-6 pt-3", className)}
      {...props}
    />
  )
}

export function SidebarTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  const { toggle } = useSidebar()

  return (
    <button
      type="button"
      data-slot="sidebar-trigger"
      className={cn(
          "grid size-9 cursor-pointer place-items-center rounded-xl bg-white/8 text-foreground ring-1 ring-white/10 transition-colors hover:bg-white/12 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        className,
      )}
      onClick={(event) => {
        toggle()
        props.onClick?.(event)
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export function SidebarMenu({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu"
      className={cn("space-y-1", className)}
      {...props}
    />
  )
}

export function SidebarMenuItem({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-item"
      className={cn(className)}
      {...props}
    />
  )
}

export function SidebarMenuButton({
  className,
  asChild = false,
  isActive,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  isActive?: boolean
}) {
  const { open } = useSidebar()
  const Comp = asChild ? Slot.Root : "button"
  const componentProps = asChild
    ? props
    : { ...props, type: props.type ?? "button" }

  return (
    <Comp
      data-slot="sidebar-menu-button"
      data-active={isActive ? "true" : "false"}
      data-collapsed={open ? "false" : "true"}
      className={cn(
        "group flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40 data-[collapsed=true]:justify-center data-[collapsed=true]:gap-0 data-[collapsed=true]:px-0 data-[collapsed=true]:[&_span]:hidden disabled:cursor-not-allowed",
        isActive
          ? "bg-white/12 text-foreground ring-1 ring-white/12"
          : "text-muted-foreground hover:bg-white/8 hover:text-foreground",
        className,
      )}
      {...componentProps}
    />
  )
}
