import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MatchReviewBody, MatchReviewView } from './MatchReview';
import { readData } from '../test/realData';
import type { Decisions, MatchExample } from '../lib/matchReview';

const M = readData<MatchExample[]>('match_examples.json');
const html = (decisions: Decisions = {}) => r(<MatchReviewView examples={M} decisions={decisions} onDecide={() => {}} />);
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
  expect(rim).toMatch(/<button[^>]*>Reject<\/button>/);
  expect(h).toContain('0 of 6 reviewed');
});

it('flags the low-confidence line and shows the resale classification', () => {
  const h = html();
  expect(card(h, 'm5')).toContain('Low confidence');
  expect(card(h, 'm1')).not.toContain('Low confidence');
  expect(card(h, 'm6')).toContain('Not a BOM part');
});

it('accepted and rejected cards collapse with Undo; others stay pending', () => {
  const h = html({ m1: 'accepted', m2: 'rejected' });
  const rim = card(h, 'm1');
  expect(rim).toContain('Accepted');
  expect(rim).toContain('Touring Rim');
  expect(rim).not.toContain('91%');
  expect(rim).not.toMatch(/>Accept</);
  expect(rim).toMatch(/<button[^>]*>Undo<\/button>/);
  expect(card(h, 'm2')).toContain('Rejected · sent to manual matching');
  expect(card(h, 'm3')).toMatch(/<button[^>]*>Accept<\/button>/);
  expect(h).toContain('2 of 6 reviewed');
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
  expect(r(<MatchReviewBody state={{ loading: true }} decisions={{}} onDecide={() => {}} />)).toMatch(/role="status"[^>]*>Loading sample lines…/);
  const err = r(<MatchReviewBody state={{ loading: false, error: new Error('Failed to load match_examples.json (404)') }} decisions={{}} onDecide={() => {}} />);
  expect(err).toContain('role="alert"');
  expect(err).toContain('Failed to load match_examples.json (404)');
  expect(err).toContain('Illustrative');
});
