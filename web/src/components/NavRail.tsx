import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navSection, type NavSection } from '../lib/nav';

const icon = (d: ReactNode) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75"
    strokeLinecap="round" strokeLinejoin="round" className="shrink-0">{d}</svg>
);

const ITEMS: { section: NavSection; to: string; label: string; icon: ReactNode }[] = [
  { section: 'costs', to: '/', label: 'Product costs', icon: icon(<><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M3 20h18" /></>) },
  { section: 'savings', to: '/savings', label: 'Savings', icon: icon(<><circle cx="12" cy="12" r="8" /><path d="M14.5 9.5c-.5-.9-1.4-1.3-2.5-1.3-1.5 0-2.5.8-2.5 1.9 0 2.6 5 1.4 5 4 0 1.1-1.1 1.9-2.5 1.9-1.2 0-2.1-.5-2.6-1.4" /><path d="M12 6.5v1.7M12 15.8v1.7" /></>) },
  { section: 'match', to: '/match-review', label: 'Match review', icon: icon(<><path d="M4 8h13l-3-3" /><path d="M20 16H7l3 3" /></>) },
];

export function NavRail() {
  const active = navSection(useLocation().pathname);
  return (
    <nav aria-label="Main" className="sticky top-0 flex h-screen w-[232px] shrink-0 flex-col self-start border-r border-border bg-nav px-4 py-6">
      <Link to="/" className="mb-8 flex items-center gap-2 px-2 text-foreground">
        {icon(<path d="M3 17l6-6 4 4 8-8" />)}
        <span className="font-serif text-[22px] leading-none">Spendline</span>
      </Link>
      <ul className="space-y-1">
        {ITEMS.map((it) => {
          const on = active === it.section;
          return (
            <li key={it.section}>
              <Link to={it.to} aria-current={on ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] ${on ? 'bg-card font-medium text-foreground shadow-card' : 'text-muted-foreground hover:bg-card/60 hover:text-foreground'}`}>
                {it.icon}{it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
