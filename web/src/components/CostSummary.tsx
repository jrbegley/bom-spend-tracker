import type { BomNode } from '../lib/data';
import { money, pctSigned, ppvUnit, unitMoney } from '../lib/format';
import { BlendedBadge } from './BlendedBadge';
import { KpiTile } from './KpiTile';

type Props = { node: Pick<BomNode, 'costUnit' | 'stdUnit' | 'ppvUnit' | 'saveUnit'>; units: number };

/** Four cost tiles for a level page. Totals = per-unit × units built. */
export function CostSummary({ node, units }: Props) {
  const ppvTotal = `${money(node.ppvUnit * units)} total`;
  const ppvCaption = node.stdUnit === 0 ? ppvTotal : `${pctSigned(node.ppvUnit / node.stdUnit)} · ${ppvTotal}`;
  return (
    <div className="grid grid-cols-4 gap-4">
      <KpiTile size="md" label="Material cost per unit" labelExtra={<BlendedBadge />} value={unitMoney(node.costUnit)} />
      <KpiTile size="md" label="Standard per unit" value={unitMoney(node.stdUnit)} />
      <KpiTile size="md" label="PPV per unit" tone="ppv" value={ppvUnit(node.ppvUnit)} caption={ppvCaption} />
      <KpiTile size="md" label="Savings at best price" tone="savings" value={unitMoney(node.saveUnit)}
        caption={`per unit · ${money(node.saveUnit * units)} total`} />
    </div>
  );
}
