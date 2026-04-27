import * as React from "react"
import { Select } from "radix-ui"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

function SelectRoot(props: React.ComponentProps<typeof Select.Root>) {
  return <Select.Root {...props} />
}

function SelectValue(props: React.ComponentProps<typeof Select.Value>) {
  return <Select.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Select.Trigger>) {
  return (
    <Select.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-11 w-full cursor-pointer items-center justify-between rounded-2xl border border-input bg-background/40 px-3 py-2 text-sm text-foreground shadow-sm backdrop-blur-md outline-none transition-colors data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      <Select.Icon asChild>
        <ChevronDown className="size-4 text-muted-foreground" />
      </Select.Icon>
    </Select.Trigger>
  )
}

function SelectContent({
  className,
  position = "popper",
  children,
  ...props
}: React.ComponentProps<typeof Select.Content>) {
  return (
    <Select.Portal>
      <Select.Content
        data-slot="select-content"
        position={position}
        className={cn(
          "z-[60] max-h-72 w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-white/10 bg-card/60 text-card-foreground shadow-[0_18px_70px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl",
          className,
        )}
        {...props}
      >
        <Select.Viewport className="w-full p-1">{children}</Select.Viewport>
      </Select.Content>
    </Select.Portal>
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Select.Item>) {
  return (
    <Select.Item
      data-slot="select-item"
      className={cn(
        "relative flex h-10 w-full cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2 text-sm outline-none focus:bg-white/10 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <Select.ItemIndicator className="absolute right-3 inline-flex items-center justify-center">
        <Check className="size-4" />
      </Select.ItemIndicator>
      <Select.ItemText>{children}</Select.ItemText>
    </Select.Item>
  )
}

export {
  SelectRoot as Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
}
