// Which main-nav section a path belongs to (SPEC_REVISION_2.md section 4: Product costs, Savings, Match review).

export type NavSection = 'costs' | 'savings' | 'match';

const under = (path: string, base: string) => path === base || path.startsWith(`${base}/`);

/** Detail pages belong to the section that leads to them: bikes and parts to Product costs, vendors to Savings. */
export function navSection(pathname: string): NavSection | null {
  if (pathname === '/' || under(pathname, '/products') || under(pathname, '/parts')) return 'costs';
  if (under(pathname, '/savings') || under(pathname, '/opportunities') || under(pathname, '/vendors')) return 'savings';
  if (under(pathname, '/match-review')) return 'match';
  return null;
}
