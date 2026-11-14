import { feedbackSummary, type Decisions, type MatchExample } from '../lib/matchReview';
import { Panel } from './primitives';

const BAND_LABEL = { High: 'High (≥80%)', Medium: 'Medium (60–79%)', Low: 'Low (<60%)' } as const;

/** What this session's reviews would feed back to the model: outcomes, override rate by confidence, reasons. */
export function FeedbackSummary({ examples, decisions }: { examples: MatchExample[]; decisions: Decisions }) {
  const s = feedbackSummary(examples, decisions);
  return (
    <Panel title="This session's feedback" subtitle="What these reviews would teach the matcher."
      footer="Kept in this browser tab only. A real deployment would store each decision as a training and evaluation example.">
      <div className="grid grid-cols-3 divide-x divide-hairline">
        {([['Confirmed', s.confirmed, 'text-savings-ink'], ['Corrected', s.corrected, 'text-caution'], ['Sent to manual', s.manual, 'text-foreground']] as const)
          .map(([label, n, cls]) => (
            <div key={label} className="px-4 py-3">
              <div className="eyebrow">{label}</div>
              <div className={`num mt-1 text-[24px] font-medium ${cls}`}>{n}</div>
            </div>
          ))}
      </div>
      <div className="border-t border-hairline px-4 py-3">
        <div className="eyebrow mb-2">Overridden, by top-match confidence</div>
        <ul className="space-y-1 text-[13px]">
          {s.bands.map((b) => (
            <li key={b.band} className="flex justify-between gap-3">
              <span>{BAND_LABEL[b.band]}</span>
              <span className="num text-muted-foreground">{b.reviewed ? `${b.overridden} of ${b.reviewed} overridden` : 'none reviewed'}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-hairline px-4 py-3">
        <div className="eyebrow mb-2">Reasons given</div>
        {s.reasons.length === 0
          ? <p className="text-[13px] text-muted-foreground">No reasons given yet</p>
          : (
            <ul className="space-y-1 text-[13px]">
              {s.reasons.map((r) => <li key={r.reason} className="flex justify-between gap-3"><span>{r.reason}</span><span className="num text-muted-foreground">{r.count}</span></li>)}
            </ul>
          )}
      </div>
    </Panel>
  );
}
