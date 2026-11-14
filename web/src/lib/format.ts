// Number formatting rules from BUILD_SPEC.md section 5.3.

const sign = (v: number, text: string, zero: string) => (text === zero ? '' : v < 0 ? '-' : '');

/** |v| >= 1M → $1.22M; >= 1K → $346.5K; else $412. Negatives get a leading minus. */
export function money(v: number): string {
  const a = Math.abs(v);
  const body = a >= 1e6 ? `${(a / 1e6).toFixed(2)}M` : a >= 1e3 ? `${(a / 1e3).toFixed(1)}K` : `${Math.round(a)}`;
  return `${sign(v, body, '0')}$${body}`;
}

/** Always 2 decimals: $854.82 */
export function unitMoney(v: number): string {
  const body = Math.abs(v).toFixed(2);
  return `${sign(v, body, '0.00')}$${body}`;
}

/** +$40.71 when positive, -$3.20 when negative, $0.00 at zero. */
export function ppvUnit(v: number): string {
  const body = Math.abs(v).toFixed(2);
  if (body === '0.00') return '$0.00';
  return `${v < 0 ? '-' : '+'}$${body}`;
}

/**
 * Percent digits with 1 decimal. Rounds the stored double to 3 decimals first
 * (toFixed uses the exact binary value), so 0.0525 → "5.2", not the "5.3"
 * that (0.0525 * 100).toFixed(1) gives.
 */
function pctBody(v: number): string {
  return (Number(Math.abs(v).toFixed(3)) * 100).toFixed(1);
}

/** 5.2% */
export function pct(v: number): string {
  const body = pctBody(v);
  return `${sign(v, body, '0.0')}${body}%`;
}

/** +5.0% / -1.2% / 0.0% */
export function pctSigned(v: number): string {
  const body = pctBody(v);
  if (body === '0.0') return '0.0%';
  return `${v < 0 ? '-' : '+'}${body}%`;
}

/** "Lowest" when 0, else signed percent. */
export function vsCheapest(v: number): string {
  return v === 0 ? 'Lowest' : pctSigned(v);
}

/** 47,107 */
export function count(v: number): string {
  return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/** None / 1 part / 2 parts */
export function singleSource(n: number): string {
  return n === 0 ? 'None' : n === 1 ? '1 part' : `${n} parts`;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthYear = (iso: string) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

/** "April 2022 to September 2025" from two ISO dates. Reads YYYY-MM directly: no Date, so no time-zone shift. */
export function periodLabel(start: string, end: string): string {
  return `${monthYear(start)} to ${monthYear(end)}`;
}
