import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

type ToastVariant = "default" | "destructive"

type ToastOptions = {
  title: string
  description?: string
  variant?: ToastVariant
  durationMs?: number
}

type ToastItem = ToastOptions & {
  id: string
}

type ToastContextValue = {
  toast: (options: ToastOptions) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined,
)

function createToastId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([])

  const dismiss = React.useCallback((id: string) => {
    setItems((previousItems) => previousItems.filter((item) => item.id !== id))
  }, [])

  const toast = React.useCallback(
    (options: ToastOptions) => {
      const id = createToastId()
      const durationMs = options.durationMs ?? 3500

      setItems((previousItems) => [{ ...options, id }, ...previousItems].slice(0, 4))

      window.setTimeout(() => {
        dismiss(id)
      }, durationMs)
    },
    [dismiss],
  )

  const value = React.useMemo<ToastContextValue>(
    () => ({ toast, dismiss }),
    [toast, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions text"
        className="fixed right-5 top-5 z-50 flex w-[360px] max-w-[calc(100vw-2.5rem)] flex-col gap-2"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "relative overflow-hidden rounded-2xl border bg-card/40 px-4 py-3 text-card-foreground shadow-[0_20px_60px_-22px_rgba(0,0,0,0.9)] backdrop-blur-xl",
              item.variant === "destructive"
                ? "border-destructive/30"
                : "border-white/10",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold leading-5">
                  {item.title}
                </div>
                {item.description ? (
                  <div className="mt-1 text-sm text-muted-foreground">
                    {item.description}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-white/8 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                aria-label="Dismiss"
                onClick={() => dismiss(item.id)}
              >
                <X className="size-4" />
              </button>
            </div>
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent",
                item.variant === "destructive" ? "via-destructive/40" : undefined,
              )}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const value = React.useContext(ToastContext)
  if (!value) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return value
}
