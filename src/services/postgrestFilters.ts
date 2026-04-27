export function toPostgrestInFilter(values: string[]) {
  const quotedValues = values.map((value) => `"${value.replaceAll('"', '\\"')}"`)
  return `in.(${quotedValues.join(",")})`
}

