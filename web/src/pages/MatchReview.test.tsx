import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MatchReviewBody, MatchReviewView } from './MatchReview';
import { CorrectionEditor, type Draft } from '../components/CorrectionEditor';
import { loadCore, readData } from '../test/realData';
import type { Decisions, MatchExample } from '../lib/matchReview';

const M = readData<MatchExample[]>('match_examples.json');
const { parts } = loadCore();
const byId = Object.fromEntries(M.map((e) => [e.id, e]));
const html = (decisions: Decisions = {}) => r(<MatchReviewView examples={M} parts={parts} decisions={decisions} onDecide={() => {}} />);
const editor = (id: string, draft: Draft) => r(<CorrectionEditor example={byId[id]} parts={parts} draft={draft} onChange={() => {}} onConfirm={() => {}} onCancel={() => {}} />);
const empty: Draft = { choice: null, query: '', reasons: [] };
const top = { choice: { kind: 'candidate' as const, rank: 1 }, reasons: [] };
/** The HTML of one queue card: from its data-match-id to the next card (cards contain nested <li>s). */
const card = (h: string, id: string) => h.slice(h.indexOf(`data-match-id="${id}"`)).split('data-match-id=')[1];

it('header with the Illustrative badge and subtitle', () => {
  const h = html();
  expect(h).toMatch(/<h1[^>]*>Match review<\/h1>/);
  expect(h).toMatch(/<span[^>]*>Illustrative<\/span>/);
  expect(h).toContain('How new spend lines would be matched to BOM parts. Sample lines are hand-written; the dataset already links parts by ID.');
});

it('six pending cards with line details, candidates and buttons', () => {
  const h = html();
  for (const m of M) expect(h).toContain(m.raw);
  const rim = card(h, 'm1');
  for (const s of ['Premier Sport, Inc.', 'EA', '$39.20', 'Touring Rim', '91%', 'HL Road Rim', '6%', 'HL Mountain Rim', '3%']) expect(rim).toContain(s);
  expect(rim).toMatch(/<button[^>]*>Accept<\/button>/);
  expect(rim).toMatch(/<button[^>]*>Correct…<\/button>/);
  expect(h).toContain('0 of 6 reviewed');
});

it('flags the low-confidence line and shows the resale classification', () => {
  const h = html();
  expect(card(h, 'm5')).toContain('Low confidence');
  expect(card(h, 'm1')).not.toContain('Low confidence');
  expect(card(h, 'm6')).toContain('Not a BOM part');
});

it('decided cards collapse with the outcome, reasons and Undo; others stay pending (M1)', () => {
  const h = html({
    m1: top,
    m5: { choice: { kind: 'candidate', rank: 2 }, reasons: ['Wrong size or variant'] },
    m2: { choice: { kind: 'manual' }, reasons: [] },
  });
  const rim = card(h, 'm1');
  expect(rim).toContain('Confirmed · Touring Rim'); expect(rim).not.toContain('91%'); expect(rim).not.toMatch(/>Accept</);
  expect(rim).toMatch(/<button[^>]*>Undo<\/button>/);
  expect(card(h, 'm5')).toContain('Corrected · ML Crankarm (was HL Crankarm)'); expect(card(h, 'm5')).toContain('Wrong size or variant');
  expect(card(h, 'm2')).toContain('Sent to manual matching');
  expect(card(h, 'm3')).toMatch(/<button[^>]*>Accept<\/button>/);
  expect(h).toContain('3 of 6 reviewed');
});

it('correction editor: choices, reasons, Confirm disabled until complete', () => {
  const h = editor('m5', empty);
  expect(h).toContain('role="radiogroup"'); expect(h).toContain('aria-label="Correct the match"');
  for (const s of ['ML Crankarm · 39%', 'LL Crankarm · 13%', 'Search all parts', 'Not a BOM part', 'No match · send to manual matching']) expect(h).toContain(s);
  expect(h.match(/type="radio"/g)).toHaveLength(5);
  expect(h).toMatch(/<button[^>]*disabled=""[^>]*>Confirm<\/button>/);
  expect(h.match(/aria-pressed="false"/g)).toHaveLength(5);
  const ready = editor('m5', { choice: { kind: 'candidate', rank: 2 }, query: '', reasons: ['Wrong part family'] });
  expect(ready).not.toMatch(/<button[^>]*disabled=""[^>]*>Confirm/); expect(ready).toMatch(/aria-pressed="true"[^>]*>Wrong part family/);
});
it('correction editor: no Not a BOM part option when that is already the top match (m6)', () => {
  expect(editor('m6', empty)).not.toMatch(/>Not a BOM part</);
});
it('correction editor: part search', () => {
  const searching = editor('m5', { choice: { kind: 'part', partId: '', partName: '' }, query: 'crank', reasons: [] });
  expect(searching).toContain('aria-label="Search parts"'); expect(searching).toMatch(/<button[^>]*>HL Crankarm<\/button>/);
  expect(searching).toMatch(/<button[^>]*disabled=""[^>]*>Confirm<\/button>/);
  const picked = editor('m5', { choice: { kind: 'part', partId: '319', partName: 'HL Crankarm' }, query: 'crank', reasons: [] });
  expect(picked).toMatch(/aria-pressed="true"[^>]*>HL Crankarm/); expect(picked).not.toMatch(/<button[^>]*disabled=""[^>]*>Confirm/);
  expect(editor('m5', { choice: { kind: 'part', partId: '', partName: '' }, query: 'zz', reasons: [] })).toContain('No parts match');
  expect(editor('m5', { choice: { kind: 'part', partId: '', partName: '' }, query: 'c', reasons: [] })).not.toContain('No parts match');
});

it('feedback summary (M3, M4)', () => {
  const h = html({
    m1: top,
    m5: { choice: { kind: 'candidate', rank: 2 }, reasons: ['Wrong size or variant'] },
    m2: { choice: { kind: 'manual' }, reasons: ['Unit of measure mismatch', 'Wrong size or variant'] },
  });
  const fb = h.slice(h.indexOf('This session&#x27;s feedback'));
  for (const s of ['Confirmed', 'Corrected', 'Sent to manual', 'High (≥80%)', '1 of 2 overridden', 'Medium (60–79%)', 'none reviewed', 'Low (&lt;60%)', '1 of 1 overridden', 'Wrong size or variant', 'Unit of measure mismatch', 'Kept in this browser tab only']) expect(fb).toContain(s);
  expect(html()).toContain('No reasons given yet');
});

it('How matching works: five steps in order and the local-model line', () => {
  const h = html();
  expect(h).toMatch(/<h2[^>]*>How matching works<\/h2>/);
  const steps = [
    'Spend line in',
    'Shortlist candidates with fuzzy matching',
    'Local LLM picks a part and scores confidence',
    'High confidence auto-accepts, low confidence goes to review',
    'Each review is stored and reused as an example',
  ];
  const at = steps.map((s) => h.indexOf(s));
  expect(at.every((i) => i > 0)).toBe(true);
  expect([...at].sort((a, b) => a - b)).toEqual(at);
  expect(h).toContain('Runs on a local model so supplier prices never leave the company.');
});

it('loading and error states', () => {
  expect(r(<MatchReviewBody state={{ loading: true }} parts={parts} decisions={{}} onDecide={() => {}} />)).toMatch(/role="status"[^>]*>Loading sample lines…/);
  const err = r(<MatchReviewBody state={{ loading: false, error: new Error('Failed to load match_examples.json (404)') }} parts={parts} decisions={{}} onDecide={() => {}} />);
  expect(err).toContain('role="alert"');
  expect(err).toContain('Failed to load match_examples.json (404)');
  expect(err).toContain('Illustrative');
});

it('a confirmed card shows no correction reasons (review fix)', () => {
  const h = html({ m5: { choice: { kind: 'part', partId: '319', partName: 'HL Crankarm' }, reasons: ['Wrong size or variant'] } });
  expect(card(h, 'm5')).toContain('Confirmed · HL Crankarm'); expect(card(h, 'm5')).not.toContain('Wrong size or variant');
});
