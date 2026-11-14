import { it, expect } from 'vitest';
import { navSection } from './nav';

it.each([['/', 'costs'], ['/products/969/821', 'costs'], ['/parts/513', 'costs'], ['/savings', 'savings'],
  ['/opportunities', 'savings'], ['/vendors', 'vendors'], ['/vendors/1678', 'vendors'], ['/match-review', 'match'], ['/nope', null]])(
  '%s → %s', (p, s) => expect(navSection(p)).toBe(s));
