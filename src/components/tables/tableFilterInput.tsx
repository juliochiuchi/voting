import type { LucideIcon } from "lucide-react"

import { Input } from "@/components/ui/input"

export function TableFilterInput({
  value,
  onChange,
  placeholder,
  icon: Icon,
  maxLength = 60,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  icon: LucideIcon
  maxLength?: number
}) {
  return (
    <div className="relative w-full">
      <Icon className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="pl-11"
        maxLength={maxLength}
      />
    </div>
  )
}
