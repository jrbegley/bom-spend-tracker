import type { ReactNode } from 'react';

/** Loading text (announced politely) or an error (announced as an alert). */
export function StatusMessage({ kind, children }: { kind: 'loading' | 'error'; children: ReactNode }) {
  return kind === 'error'
    ? <p role="alert" className="text-text-secondary">{children}</p>
    : <p role="status" className="text-text-muted">{children}</p>;
}
