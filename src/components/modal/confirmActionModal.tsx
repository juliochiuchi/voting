import * as React from "react"

import { AppModal } from "@/components/modal/appModal"
import { Button } from "@/components/ui/button"

type ConfirmActionModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: React.ComponentProps<typeof Button>["variant"]
  onConfirm: () => void | Promise<void>
}

export function ConfirmActionModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmVariant = "default",
  onConfirm,
}: ConfirmActionModalProps) {
  const [isConfirming, setIsConfirming] = React.useState(false)

  React.useEffect(() => {
    if (!open) setIsConfirming(false)
  }, [open])

  const handleConfirm = React.useCallback(async () => {
    if (isConfirming) return
    setIsConfirming(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsConfirming(false)
    }
  }, [isConfirming, onConfirm, onOpenChange])

  return (
    <AppModal
      open={open}
      onOpenChange={(nextOpen) => {
        if (isConfirming) return
        onOpenChange(nextOpen)
      }}
      title={title}
      description={description}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl bg-background/15 hover:bg-background/25"
            disabled={isConfirming}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            className="rounded-2xl"
            disabled={isConfirming}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}
