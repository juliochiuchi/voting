import * as React from "react"
import { Avatar } from "radix-ui"

import { cn } from "@/lib/utils"

function AvatarRoot({
  className,
  ...props
}: React.ComponentProps<typeof Avatar.Root>) {
  return (
    <Avatar.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/10",
        className,
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof Avatar.Image>) {
  return (
    <Avatar.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof Avatar.Fallback>) {
  return (
    <Avatar.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center bg-white/10 text-sm font-semibold text-foreground/90",
        className,
      )}
      {...props}
    />
  )
}

export { AvatarRoot as Avatar, AvatarImage, AvatarFallback }

