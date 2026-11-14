import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { NavRail } from './NavRail';

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const width = pathname === '/' ? 'max-w-[1180px]' : 'max-w-[1280px]';
  return (
    <div className="flex min-h-screen bg-bg">
      <NavRail />
      <main className="min-w-0 flex-1 px-8 py-7">
        <div className={`mx-auto ${width}`}>{children}</div>
      </main>
    </div>
  );
}
