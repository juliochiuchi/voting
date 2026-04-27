import type * as React from "react"
import { Info, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

export function RuleAlert({
  title,
  description,
  className,
  onDismiss,
}: {
  title: string
  description: React.ReactNode
  className?: string
  onDismiss?: () => void
}) {
  return (
    <Alert className={cn("mb-6", className)}>
      <Info className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
      {onDismiss ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Fechar aviso"
          className="absolute right-2 top-2 rounded-xl text-muted-foreground hover:bg-white/8 hover:text-foreground"
          onClick={onDismiss}
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </Alert>
  )
}

