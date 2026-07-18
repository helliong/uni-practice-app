export function escapeCsvValue(value: string | null | undefined) {
  let safeValue = value || "";
  if (/^[=+\-@]/.test(safeValue)) safeValue = `'${safeValue}`;
  return `"${safeValue.replace(/"/g, '""')}"`;
}
