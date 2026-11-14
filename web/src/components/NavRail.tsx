import { NavLink } from 'react-router-dom';

const base = 'block rounded-lg px-3 py-2 text-[13px] text-muted-foreground hover:bg-muted';
const active = 'bg-primary-soft text-primary font-medium hover:bg-primary-soft';
const cls = ({ isActive }: { isActive: boolean }) => `${base} ${isActive ? active : ''}`;

export function NavRail() {
  return (
    <nav aria-label="Main" className="w-[232px] shrink-0 border-r border-border bg-card px-3 py-5">
      <div className="mb-5 px-3 text-[15px] font-semibold">Spendline</div>
      <ul className="space-y-0.5">
        <li><NavLink to="/" end className={cls}>Overview</NavLink></li>
        <li><NavLink to="/products" className={cls}>Products</NavLink></li>
        <li><NavLink to="/opportunities" className={cls}>Opportunities</NavLink></li>
        <li><NavLink to="/vendors" className={cls}>Vendors</NavLink></li>
      </ul>
      <div className="mt-6 mb-1 px-3 text-[12px] text-muted-foreground">Pipeline</div>
      <ul>
        <li><NavLink to="/match-review" className={cls}>Match review</NavLink></li>
      </ul>
    </nav>
  );
}
