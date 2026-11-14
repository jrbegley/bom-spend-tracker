import { useState } from 'react';
import { StatusMessage } from '../components/StatusMessage';
import { useJson, type JsonState } from '../lib/data';
import { unitMoney } from '../lib/format';
import { decide, reviewProgress, type Decision, type Decisions, type MatchExample } from '../lib/matchReview';

type OnDecide = (id: string, decision: Decision | null) => void;

const card = 'rounded-card border border-border bg-surface';
const btn = 'rounded-input px-3 py-1.5 text-[13px] font-medium';
const linkBtn = 'text-[13px] text-accent hover:text-accent-hover';

const STEPS = [
  'Spend line in',
  'Shortlist candidates with fuzzy matching',
  'Local LLM picks a part and scores confidence',
  'High confidence auto-accepts, low confidence goes to review',
  'Each review is stored and reused as an example',
];

function Header() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-[24px] font-semibold">Match review</h1>
        <span className="rounded-chip border border-ppv-bar bg-warn-tint px-1.5 py-0.5 text-[12px] font-medium text-ppv">Illustrative</span>
      </div>
      <p className="mt-1 text-text-secondary">
        How new spend lines would be matched to BOM parts. Sample lines are hand-written; the dataset already links parts by ID.
      </p>
    </div>
  );
}

function LineDetails({ m }: { m: MatchExample }) {
  return (
    <>
      <div className="font-mono text-[13px]">{m.raw}</div>
      <div className="mt-0.5 text-[12px] text-text-secondary">{`${m.vendor} · ${m.uom} · ${unitMoney(m.price)}`}</div>
    </>
  );
}

function PendingCard({ m, onDecide }: { m: MatchExample; onDecide: OnDecide }) {
  const top = m.candidates[0];
  const low = top.confidence < 0.6;
  return (
    <div className="p-4">
      <LineDetails m={m} />
      <ul className="mt-3 space-y-1.5" aria-label={`Candidate parts for ${m.raw}`}>
        {m.candidates.map((c, i) => (
          <li key={c.partId ?? c.name} className="grid grid-cols-[minmax(0,1fr)_120px_40px] items-center gap-3">
            <span className={i === 0 ? 'font-medium' : 'text-text-secondary'}>{c.name}</span>
            <span className="block h-2 rounded-chip bg-rule" aria-hidden="true">
              <span className={`block h-full rounded-chip ${i === 0 ? 'bg-accent' : 'bg-[#A1A1AA]'}`} style={{ width: `${c.confidence * 100}%` }} />
            </span>
            <span className="text-right tabular-nums">{`${Math.round(c.confidence * 100)}%`}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center gap-2">
        <button type="button" className={`${btn} bg-accent text-white hover:bg-accent-hover`} aria-describedby={`${m.id}-top`}
          onClick={() => onDecide(m.id, 'accepted')}>Accept</button>
        <button type="button" className={`${btn} border border-border bg-surface hover:bg-group-row`} aria-describedby={`${m.id}-top`}
          onClick={() => onDecide(m.id, 'rejected')}>Reject</button>
        <span id={`${m.id}-top`} className="text-[12px] text-text-muted">{`Top match: ${top.name}`}</span>
        {low && <span className="ml-auto text-[12px] font-medium text-ppv">Low confidence · needs a reviewer</span>}
      </div>
    </div>
  );
}

function DecidedCard({ m, decision, onDecide }: { m: MatchExample; decision: Decision; onDecide: OnDecide }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      {decision === 'accepted'
        ? <span aria-hidden="true" className="font-semibold text-savings">✓</span>
        : <span aria-hidden="true" className="font-semibold text-text-muted">✕</span>}
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[13px] text-text-secondary">{m.raw}</div>
        <div className="mt-0.5 text-[12px]">
          {decision === 'accepted'
            ? <><span className="font-medium text-savings">Accepted</span>{` · ${m.candidates[0].name}`}</>
            : <span className="text-text-secondary">Rejected · sent to manual matching</span>}
        </div>
      </div>
      <button type="button" className={linkBtn} onClick={() => onDecide(m.id, null)}>Undo</button>
    </div>
  );
}

function HowItWorks() {
  return (
    <section className={`${card} p-4`}>
      <h2 className="text-[15px] font-semibold">How matching works</h2>
      <ol className="mt-3">
        {STEPS.map((s, i) => (
          <li key={s}>
            {i > 0 && <div aria-hidden="true" className="py-1 text-center text-text-muted">↓</div>}
            <div className="rounded-input border border-border px-3 py-2">
              <span className="mr-2 text-text-muted tabular-nums">{i + 1}</span>{s}
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 border-t border-rule pt-3 text-[12px] text-text-secondary">
        Runs on a local model so supplier prices never leave the company.
      </p>
    </section>
  );
}

type ViewProps = { examples: MatchExample[]; decisions: Decisions; onDecide: OnDecide };

export function MatchReviewView({ examples, decisions, onDecide }: ViewProps) {
  return (
    <div className="space-y-6">
      <Header />
      <div className="grid grid-cols-[2fr_1fr] items-start gap-4">
        <section aria-labelledby="queue-title">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 id="queue-title" className="text-[15px] font-semibold">Review queue</h2>
            <span className="text-[12px] text-text-muted" role="status">{reviewProgress(examples, decisions)}</span>
          </div>
          <ul className="space-y-3">
            {examples.map((m) => (
              <li key={m.id} data-match-id={m.id} className={card}>
                {decisions[m.id]
                  ? <DecidedCard m={m} decision={decisions[m.id]} onDecide={onDecide} />
                  : <PendingCard m={m} onDecide={onDecide} />}
              </li>
            ))}
          </ul>
        </section>
        <HowItWorks />
      </div>
    </div>
  );
}

type BodyProps = { state: JsonState<MatchExample[]>; decisions: Decisions; onDecide: OnDecide };

/** The screen for any fetch state: the header always shows, the queue once the samples load. */
export function MatchReviewBody({ state, decisions, onDecide }: BodyProps) {
  if (state.error) {
    return (
      <div className="space-y-6">
        <Header />
        <StatusMessage kind="error">{`Could not load the sample lines: ${state.error.message}`}</StatusMessage>
      </div>
    );
  }
  if (state.loading || !state.data) {
    return (
      <div className="space-y-6">
        <Header />
        <StatusMessage kind="loading">Loading sample lines…</StatusMessage>
      </div>
    );
  }
  return <MatchReviewView examples={state.data} decisions={decisions} onDecide={onDecide} />;
}

export default function MatchReview() {
  const state = useJson<MatchExample[]>('match_examples.json');
  const [decisions, setDecisions] = useState<Decisions>({});
  return <MatchReviewBody state={state} decisions={decisions} onDecide={(id, d) => setDecisions((s) => decide(s, id, d))} />;
}
