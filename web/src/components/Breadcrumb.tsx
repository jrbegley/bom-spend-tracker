import { Fragment } from 'react';
import { Link } from 'react-router-dom';

export type Crumb = { label: string; to?: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 text-[13px] text-text-secondary">
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={i}>
            {i > 0 && <span aria-hidden="true" className="text-text-muted"> / </span>}
            {last ? <span aria-current="page">{it.label}</span>
              : it.to ? <Link to={it.to} className="text-accent hover:text-accent-hover">{it.label}</Link>
              : <span>{it.label}</span>}
          </Fragment>
        );
      })}
    </nav>
  );
}
