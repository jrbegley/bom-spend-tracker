import { Fragment } from 'react';
import { Link } from 'react-router-dom';

export type Crumb = { label: string; to?: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 text-[13px] text-muted-foreground">
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={i}>
            {i > 0 && <span aria-hidden="true" className="text-muted-foreground"> / </span>}
            {last ? <span aria-current="page">{it.label}</span>
              : it.to ? <Link to={it.to} className="text-primary hover:text-primary/80">{it.label}</Link>
              : <span>{it.label}</span>}
          </Fragment>
        );
      })}
    </nav>
  );
}
