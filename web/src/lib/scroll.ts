/**
 * Whether a navigation should scroll the page to the top: only when the path changes through a
 * link or redirect. Back/Forward and query-only changes (?line=, ?highlight=) keep the position.
 */
export function shouldScrollTop(prevPath: string | null, path: string, navType: 'PUSH' | 'REPLACE' | 'POP'): boolean {
  return navType !== 'POP' && prevPath !== null && prevPath !== path;
}
