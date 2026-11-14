import { useState } from 'react';
import { ProductTable } from '../components/ProductTable';
import { useCoreData, type Product } from '../lib/data';
import { filterByName } from '../lib/productGroups';

type Props = { products: Product[]; query: string; onQueryChange: (q: string) => void };

export function ProductsView({ products, query, onQueryChange }: Props) {
  const filtered = filterByName(products, query);
  return (
    <div className="space-y-6">
      <h1 className="text-[24px] font-semibold">Products</h1>
      <input type="search" aria-label="Filter products" placeholder="Filter by name" value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="h-[38px] w-[300px] rounded-md border border-border bg-card px-3" />
      {filtered.length === 0 ? (
        <p className="text-muted-foreground">{`No products match “${query.trim()}”`}</p>
      ) : (
        <section className="rounded-xl border border-border bg-card">
          <ProductTable products={filtered} />
        </section>
      )}
    </div>
  );
}

export default function Products() {
  const [query, setQuery] = useState('');
  return <ProductsView products={useCoreData().products} query={query} onQueryChange={setQuery} />;
}
