export function formatCpf(value: string) {
  const digitsOnly = value.replace(/\D/g, "")
  if (digitsOnly.length !== 11) return digitsOnly

  return `${digitsOnly.slice(0, 3)}.${digitsOnly.slice(3, 6)}.${digitsOnly.slice(6, 9)}-${digitsOnly.slice(9, 11)}`
}

