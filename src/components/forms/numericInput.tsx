import * as React from "react"

import { Input } from "@/components/ui/input"

export function NumericInput({
  value,
  onValueChange,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
  value: string
  onValueChange: (value: string) => void
}) {
  return (
    <Input
      {...props}
      value={value}
      inputMode="numeric"
      pattern="[0-9]*"
      onChange={(event) => {
        const digitsOnlyValue = event.target.value.replace(/\D/g, "")
        onValueChange(digitsOnlyValue)
      }}
    />
  )
}

