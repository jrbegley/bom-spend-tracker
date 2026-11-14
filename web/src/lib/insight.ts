// The data-driven sentence on the insight banner (BUILD_SPEC.md section 7.3, plan decision D9).
import type { BomNode, CoreData } from './data';
import { money, unitMoney } from './format';

export type Insight = { text: string; partId: string; partName: string };

const THRESHOLD = 10000;

/** The biggest price-gap opportunity among the node's purchased parts, or null when none reaches $10K. */
export function buildInsight(chain: BomNode[], core: CoreData): Insight | null {
  const node = chain[chain.length - 1];
  const inNode = new Set(node.leafParts.map((l) => l.partId));
  const opp = core.opportunities
    .filter((o) => inNode.has(o.partId) && o.savings >= THRESHOLD)
    .sort((a, b) => b.savings - a.savings)[0];
  if (!opp) return null;
  const part = core.parts[opp.partId];
  if (!part) return null;

  const users = node.children.filter((c) => c.id === opp.partId || c.leafParts.some((l) => l.partId === opp.partId));
  const direct = node.children.some((c) => c.id === opp.partId);
  const whole = chain.length === 1 ? 'This bike' : 'This assembly';
  const subject = direct || users.length <= 1 ? `${whole} uses`
    : users.length === 2 ? `${users[0].name} and ${users[1].name} use`
    : `${users.length} components use`;

  const byPrice = [...part.vendors].sort((a, b) => b.avgPrice - a.avgPrice);
  const hi = byPrice[0]; const lo = byPrice[byPrice.length - 1];
  const vendorClause = byPrice.length === 2
    ? `bought at ${unitMoney(hi.avgPrice)} from ${hi.name} and ${unitMoney(lo.avgPrice)} from ${lo.name}`
    : `bought from ${byPrice.length} vendors at ${unitMoney(lo.avgPrice)} to ${unitMoney(hi.avgPrice)}`;

  return {
    partId: opp.partId, partName: part.name,
    text: `${subject} the ${part.name}, ${vendorClause}. Harmonizing it saves ${money(opp.savings)} across ${opp.productCount} bikes.`,
  };
}
