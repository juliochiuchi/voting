import { UserCheck, UserX } from "lucide-react"
import * as React from "react"

import { AppModal } from "@/components/modal/appModal"
import { Button } from "@/components/ui/button"

export function ElectedDecisionModal({
  open,
  onOpenChange,
  isSaving,
  memberName,
  onAccept,
  onDecline,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSaving: boolean
  memberName: string
  onAccept: () => void | Promise<void>
  onDecline: () => void | Promise<void>
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!open) setIsSubmitting(false)
  }, [open])

  async function handleAction(action: "accept" | "decline") {
    if (isSaving || isSubmitting) return
    setIsSubmitting(true)
    try {
      if (action === "accept") {
        await onAccept()
      } else {
        await onDecline()
      }
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppModal
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSaving || isSubmitting) return
        onOpenChange(nextOpen)
      }}
      title="Confirmar eleito"
      description="O membro deseja aceitar?"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 rounded-2xl bg-background/15 px-5 hover:bg-background/25"
            disabled={isSaving || isSubmitting}
            onClick={() => void handleAction("decline")}
          >
            <UserX className="size-4" />
            Recusar
          </Button>
          <Button
            type="button"
            size="lg"
            className="h-11 rounded-2xl px-5 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.9)]"
            disabled={isSaving || isSubmitting}
            onClick={() => void handleAction("accept")}
          >
            <UserCheck className="size-4" />
            Aceitar
          </Button>
        </>
      }
    >
      <div className="rounded-3xl border border-white/10 bg-background/10 p-4 text-sm shadow-[0_24px_90px_-40px_rgba(0,0,0,0.95)] backdrop-blur-xl">
        <div className="font-medium text-foreground">{memberName}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Confirme o status do membro pré-eleito.
        </div>
      </div>
    </AppModal>
  )
}

