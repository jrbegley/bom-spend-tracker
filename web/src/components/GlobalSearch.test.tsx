import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { GlobalSearch } from './GlobalSearch';
import { loadCore } from '../test/realData';
it('closed combobox with label and placeholder', () => {
  const h = r(<MemoryRouter><GlobalSearch core={loadCore()} /></MemoryRouter>);
  expect(h).toContain('>Search<'); expect(h).toContain('role="combobox"'); expect(h).toContain('aria-expanded="false"');
  expect(h).toContain('placeholder="Touring Rim, Road-650, Proseware"'); expect(h).toContain('w-[300px]'); expect(h).toContain('h-[38px]');
});
it('closed combobox does not point aria-controls at a listbox that is not rendered', () => {
  const h = r(<MemoryRouter><GlobalSearch core={loadCore()} /></MemoryRouter>);
  expect(h).not.toContain('aria-controls');
  expect(h).not.toContain('role="listbox"');
});
