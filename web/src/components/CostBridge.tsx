import { bridge, type BridgeStep } from '../lib/bridge';
import { ppvUnit, unitMoney } from '../lib/format';
import { Panel } from './primitives';

const FILL: Record<BridgeStep['key'], string> = { standard: 'bg-standard', ppv: 'bg-ppv', actual: 'bg-primary' };
const tick = (v: number) => (v >= 100 ? `$${Math.round(v)}` : unitMoney(v));

/** Waterfall from standard to actual cost, per bike, drawn with positioned divs. */
export function CostBridge({ node }: { node: { stdUnit: number; ppvUnit: number; costUnit: number } }) {
  const { steps, axisMin, axisMax } = bridge(node);
  const range = axisMax - axisMin || 1;
  const pos = (v: number) => (Math.max(axisMin, Math.min(axisMax, v)) - axisMin) / range;
  const ticks = [0, 1, 2, 3, 4].map((k) => axisMin + (range * k) / 4);
  return (
    <Panel title="From standard to actual cost, per bike" subtitle="Purchased material only. Rejects and warranty are added in a later phase."
      footer={axisMin > 0 ? `Axis starts at ${unitMoney(axisMin)} so the step is readable.` : undefined}>
      <div className="px-6 pt-6 pb-4">
        <div className="flex gap-4">
          <div className="relative h-[220px] w-12 shrink-0 text-right text-[12px] text-muted-foreground" aria-hidden="true">
            {ticks.map((t) => <span key={t} className="num absolute right-0" style={{ bottom: `${pos(t) * 100}%`, transform: 'translateY(50%)' }}>{tick(t)}</span>)}
          </div>
          <div className="relative h-[220px] flex-1">
            {ticks.map((t) => <div key={t} aria-hidden="true" className="absolute inset-x-0 border-t border-dashed border-hairline" style={{ bottom: `${pos(t) * 100}%` }} />)}
            <div className="absolute inset-0 grid grid-cols-3 gap-8">
              {steps.map((s) => {
                const a = pos(Math.min(s.from, s.to)); const b = pos(Math.max(s.from, s.to));
                return (
                  <div key={s.key} className="relative">
                    <div className={`animate-grow-y absolute inset-x-3 rounded-md ${FILL[s.key]}`}
                      style={{ bottom: `${a * 100}%`, height: `max(${(b - a) * 100}%, 2px)` }} title={`${s.label} ${unitMoney(s.value)}`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="ml-16 mt-3 grid grid-cols-3 gap-8 text-center">
          {steps.map((s) => (
            <div key={s.key}>
              <div className="text-[13px] text-muted-foreground">{s.label}</div>
              <div className="num text-[15px] font-medium">{s.key === 'ppv' ? ppvUnit(s.value) : unitMoney(s.value)}</div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
