import type { ReactNode } from 'react';
import { useCoreData } from '../lib/data';
import { GlobalSearch } from './GlobalSearch';
import { NavRail } from './NavRail';

/** Nav rail on the left; top bar with search and the (not yet active) year and Assumptions controls. */
export function AppShell({ children }: { children: ReactNode }) {
  const core = useCoreData();
  return (
    <div className="flex min-h-screen bg-background">
      <NavRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-end gap-3 border-b border-hairline bg-background/90 px-10 backdrop-blur">
          <div className="mr-auto"><GlobalSearch core={core} hideLabel /></div>
          <select aria-label="Fiscal year" disabled title="Fiscal years arrive in phase 5c"
            className="h-[38px] rounded-md border border-input bg-card px-3 text-[14px] text-muted-foreground">
            <option>All years</option>
          </select>
          <button type="button" disabled title="Assumptions arrive in phase 5c"
            className="h-[38px] rounded-md border border-input bg-card px-4 text-[14px] text-muted-foreground">Assumptions</button>
        </header>
        <main className="min-w-0 flex-1 px-10 py-10">
          <div className="mx-auto max-w-[1120px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
