export function num(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return 0;
}

export function bool(value: unknown): boolean {
  return value === 1 || value === true || value === "1";
}
