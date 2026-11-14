import { it, expect } from 'vitest';
import { shouldScrollTop } from './scroll';

it('scrolls to top on a new path from a link or redirect', () => {
  expect(shouldScrollTop('/products/969', '/parts/513', 'PUSH')).toBe(true);
  expect(shouldScrollTop('/products/969/913', '/parts/513', 'REPLACE')).toBe(true);
});
it('keeps the position on Back/Forward and on query-only changes', () => {
  expect(shouldScrollTop('/parts/513', '/products/969', 'POP')).toBe(false);
  expect(shouldScrollTop('/', '/', 'PUSH')).toBe(false); // /?line=Touring
  expect(shouldScrollTop(null, '/', 'POP')).toBe(false); // first render
});
