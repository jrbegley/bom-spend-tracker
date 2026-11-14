import { Fragment } from 'react';
import { Link } from 'react-router-dom';

export type Crumb = { label: string; to?: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-[14px] text-muted-foreground [&_[aria-current=page]]:text-foreground">
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={i}>
            {i > 0 && <span aria-hidden="true" className="px-1.5 text-muted-foreground/50"> / </span>}
            {last ? <span aria-current="page">{it.label}</span>
              : it.to ? <Link to={it.to} className="hover:text-foreground">{it.label}</Link>
              : <span>{it.label}</span>}
          </Fragment>
        );
      })}
    </nav>
  );
}
