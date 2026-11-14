// Text color for a "vs cheapest" value (BUILD_SPEC.md section 5.4).
export function vsCls(v: number) {
  if (v === 0) return 'text-muted-foreground';
  return v > 0.05 ? 'text-ppv-ink font-semibold' : 'text-ppv-ink';
}
