import { useState } from 'react';
import { CorrectionEditor, type Draft } from '../components/CorrectionEditor';
import { FeedbackSummary } from '../components/FeedbackSummary';
import { Chip } from '../components/primitives';
import { StatusMessage } from '../components/StatusMessage';
import { useCoreData, useJson, type JsonState, type Part } from '../lib/data';
import { unitMoney } from '../lib/format';
import { decide, resolve, reviewProgress, type Decision, type Decisions, type MatchExample } from '../lib/matchReview';

type OnDecide = (id: string, decision: Decision | null) => void;

const card = 'rounded-2xl border border-border bg-card shadow-card';
const btn = 'rounded-md px-3 py-1.5 text-[13px] font-medium';
const linkBtn = 'text-[13px] text-primary hover:text-primary/80';

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
        <h1 className="text-[28px] font-semibold tracking-tight">Match review</h1>
        <Chip tone="caution">Illustrative</Chip>
      </div>
      <p className="mt-1.5 text-[15px] text-muted-foreground">
        How new spend lines would be matched to BOM parts. Sample lines are hand-written; the dataset already links parts by ID.
      </p>
    </div>
  );
}

function LineDetails({ m }: { m: MatchExample }) {
  return (
    <>
      <div className="font-mono text-[13px]">{m.raw}</div>
      <div className="mt-0.5 text-[12px] text-muted-foreground">{`${m.vendor} · ${m.uom} · ${unitMoney(m.price)}`}</div>
    </>
  );
}

const EMPTY: Draft = { choice: null, query: '', reasons: [] };

function PendingCard({ m, parts, onDecide }: { m: MatchExample; parts: Record<string, Part>; onDecide: OnDecide }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const top = m.candidates[0];
  const low = top.confidence < 0.6;
  return (
    <div className="p-5">
      <LineDetails m={m} />
      <ul className="mt-3 space-y-1.5" aria-label={`Candidate parts for ${m.raw}`}>
        {m.candidates.map((c, i) => (
          <li key={c.partId ?? c.name} className="grid grid-cols-[minmax(0,1fr)_120px_40px] items-center gap-3">
            <span className={i === 0 ? 'font-medium' : 'text-muted-foreground'}>{c.name}</span>
            <span className="block h-2 rounded-full bg-muted" aria-hidden="true">
              <span className={`block h-full rounded-full ${i === 0 ? 'bg-primary' : 'bg-price'}`} style={{ width: `${c.confidence * 100}%` }} />
            </span>
            <span className="num text-right">{`${Math.round(c.confidence * 100)}%`}</span>
          </li>
        ))}
      </ul>
      {draft ? (
        <CorrectionEditor example={m} parts={parts} draft={draft} onChange={setDraft} onCancel={() => setDraft(null)}
          onConfirm={() => draft.choice && onDecide(m.id, { choice: draft.choice, reasons: draft.reasons })} />
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <button type="button" className={`${btn} bg-primary text-primary-foreground hover:bg-primary/90`} aria-describedby={`${m.id}-top`}
            onClick={() => onDecide(m.id, { choice: { kind: 'candidate', rank: 1 }, reasons: [] })}>Accept</button>
          <button type="button" className={`${btn} border border-border bg-card hover:bg-muted`}
            onClick={() => setDraft(EMPTY)}>Correct…</button>
          <span id={`${m.id}-top`} className="text-[12px] text-muted-foreground">{`Top match: ${top.name}`}</span>
          {low && <span className="ml-auto text-[12px] font-medium text-caution">Low confidence · needs a reviewer</span>}
        </div>
      )}
    </div>
  );
}

function DecidedCard({ m, decision, onDecide }: { m: MatchExample; decision: Decision; onDecide: OnDecide }) {
  const { outcome, partName } = resolve(m, decision.choice);
  return (
    <div className="flex items-start gap-3 px-5 py-3.5">
      <span aria-hidden="true" className={`font-semibold ${outcome === 'confirmed' ? 'text-savings-ink' : outcome === 'corrected' ? 'text-caution' : 'text-muted-foreground'}`}>
        {outcome === 'manual' ? '→' : '✓'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[13px] text-muted-foreground">{m.raw}</div>
        <div className="mt-0.5 text-[13px]">
          {outcome === 'confirmed' && <span className="font-medium text-savings-ink">{`Confirmed · ${partName}`}</span>}
          {outcome === 'corrected' && <span className="font-medium text-caution">{`Corrected · ${partName} (was ${m.candidates[0].name})`}</span>}
          {outcome === 'manual' && <span className="text-muted-foreground">Sent to manual matching</span>}
        </div>
        {decision.reasons.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">{decision.reasons.map((r) => <Chip key={r}>{r}</Chip>)}</div>
        )}
      </div>
      <button type="button" className={linkBtn} onClick={() => onDecide(m.id, null)}>Undo</button>
    </div>
  );
}

function HowItWorks() {
  return (
    <section className={`${card} p-5`}>
      <h2 className="text-[15px] font-semibold">How matching works</h2>
      <ol className="mt-3">
        {STEPS.map((s, i) => (
          <li key={s}>
            {i > 0 && <div aria-hidden="true" className="py-1 text-center text-muted-foreground">↓</div>}
            <div className="rounded-md border border-border px-3 py-2">
              <span className="mr-2 text-muted-foreground tabular-nums">{i + 1}</span>{s}
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 border-t border-hairline pt-3 text-[12px] text-muted-foreground">
        Runs on a local model so supplier prices never leave the company.
      </p>
    </section>
  );
}

type ViewProps = { examples: MatchExample[]; parts: Record<string, Part>; decisions: Decisions; onDecide: OnDecide };

export function MatchReviewView({ examples, parts, decisions, onDecide }: ViewProps) {
  return (
    <div className="space-y-6">
      <Header />
      <div className="grid grid-cols-[2fr_1fr] items-start gap-4">
        <section aria-labelledby="queue-title">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 id="queue-title" className="text-[15px] font-semibold">Review queue</h2>
            <span className="text-[12px] text-muted-foreground" role="status">{reviewProgress(examples, decisions)}</span>
          </div>
          <ul className="space-y-3">
            {examples.map((m) => (
              <li key={m.id} data-match-id={m.id} className={card}>
                {decisions[m.id]
                  ? <DecidedCard m={m} decision={decisions[m.id]} onDecide={onDecide} />
                  : <PendingCard m={m} parts={parts} onDecide={onDecide} />}
              </li>
            ))}
          </ul>
        </section>
        <div className="space-y-4">
          <HowItWorks />
          <FeedbackSummary examples={examples} decisions={decisions} />
        </div>
      </div>
    </div>
  );
}

type BodyProps = { state: JsonState<MatchExample[]>; parts: Record<string, Part>; decisions: Decisions; onDecide: OnDecide };

/** The screen for any fetch state: the header always shows, the queue once the samples load. */
export function MatchReviewBody({ state, parts, decisions, onDecide }: BodyProps) {
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
  return <MatchReviewView examples={state.data} parts={parts} decisions={decisions} onDecide={onDecide} />;
}

export default function MatchReview() {
  const state = useJson<MatchExample[]>('match_examples.json');
  const [decisions, setDecisions] = useState<Decisions>({});
  return <MatchReviewBody state={state} parts={useCoreData().parts} decisions={decisions} onDecide={(id, d) => setDecisions((s) => decide(s, id, d))} />;
}
