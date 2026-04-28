import * as React from "react"
import { DropdownMenu } from "radix-ui"

import { cn } from "@/lib/utils"

function DropdownMenuRoot(
  props: React.ComponentProps<typeof DropdownMenu.Root>,
) {
  return <DropdownMenu.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuTrigger(
  props: React.ComponentProps<typeof DropdownMenu.Trigger>,
) {
  return <DropdownMenu.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

function DropdownMenuPortal(
  props: React.ComponentProps<typeof DropdownMenu.Portal>,
) {
  return <DropdownMenu.Portal data-slot="dropdown-menu-portal" {...props} />
}

function DropdownMenuContent({
  className,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof DropdownMenu.Content> & { sideOffset?: number }) {
  return (
    <DropdownMenuPortal>
      <DropdownMenu.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[220px] overflow-hidden rounded-2xl border border-white/10 bg-card/70 p-1 text-foreground shadow-[0_24px_90px_-40px_rgba(0,0,0,0.95)] backdrop-blur-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      />
    </DropdownMenuPortal>
  )
}

function DropdownMenuItem({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenu.Item> & { inset?: boolean }) {
  return (
    <DropdownMenu.Item
      data-slot="dropdown-menu-item"
      data-inset={inset ? "" : undefined}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2 text-sm outline-none transition-colors focus:bg-white/10 focus:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-10",
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenu.Separator>) {
  return (
    <DropdownMenu.Separator
      data-slot="dropdown-menu-separator"
      className={cn("my-1 h-px bg-white/10", className)}
      {...props}
    />
  )
}

export {
  DropdownMenuRoot as DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
}

