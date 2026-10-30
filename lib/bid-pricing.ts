/**
 * Bid pricing — Reg's rule, enforced in code rather than left to the model:
 *
 *  1. The buyer published a price or budget (e.g. £50k) → bid that figure. Buyers set
 *     budgets to spend them; coming in well under reads as under-scoped, not good value.
 *     Never go above a fixed price or a ceiling.
 *  2. No published price → price it ourselves and undercut the big players, but never
 *     below the floor that covers delivery cost plus margin.
 *
 * The rates below are planning assumptions, not market data — Reg should adjust them
 * as real bid outcomes come in.
 */

export type PricingDivision = 'climate' | 'education' | 'impact'
export type ValueType = 'fixed' | 'ceiling' | 'estimate' | 'none'

/** Typical blended day rate a large incumbent charges for this kind of work (GBP). */
export const INCUMBENT_DAY_RATE: Record<PricingDivision, number> = {
  climate: 1100,  // Big Four / Carbon Trust / engineering consultancies
  education: 750, // national education consultancies and research organisations
  impact: 900,    // large evaluation and social research firms
}

/** How far under the incumbent we price when the buyer published no figure. */
export const UNDERCUT = 0.25

/** Minimum revenue per day of estimated effort — delivery cost plus margin. Never price below this. */
export const FLOOR_DAY_RATE = 450

/** Markup applied to any subcontracted partner cost we pass through. */
export const SUBCONTRACT_MARKUP = 0.15

export interface PricingInput {
  division: PricingDivision
  value_type: ValueType
  /** The figure the buyer published, in GBP. Omit or 0 when value_type is 'none'. */
  published_value?: number
  /** Our honest estimate of days of work needed to deliver the full scope well. */
  estimated_days: number
  /** Any partner/subcontractor cost in GBP (e.g. an accredited assessor). */
  subcontract_cost?: number
}

export interface PricingResult {
  recommended_price: number
  floor_price: number
  basis: 'published_value' | 'undercut_incumbent' | 'floor'
  bid: boolean
  rationale: string
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step
const gbp = (n: number) => `£${n.toLocaleString('en-GB')}`

export function priceBid(input: PricingInput): PricingResult {
  const days = Math.max(0, Number(input.estimated_days) || 0)
  const subcontract = Math.max(0, Number(input.subcontract_cost) || 0)
  const published = Math.max(0, Number(input.published_value) || 0)
  const floor = roundTo(days * FLOOR_DAY_RATE + subcontract * (1 + SUBCONTRACT_MARKUP), 50)

  const valueType: ValueType = input.value_type !== 'none' && published > 0 ? input.value_type : 'none'

  if (valueType !== 'none') {
    const kind = valueType === 'fixed' ? 'fixed price' : valueType === 'ceiling' ? 'maximum budget' : 'estimated value'
    if (floor > published) {
      return {
        recommended_price: published,
        floor_price: floor,
        basis: 'published_value',
        bid: false,
        rationale:
          `The buyer published a ${kind} of ${gbp(published)}, but delivering ${days} days of work` +
          `${subcontract ? ` plus ${gbp(subcontract)} of partner cost` : ''} needs at least ${gbp(floor)}. ` +
          `Don't bid at a loss: either no-bid, or bid ${gbp(published)} against a reduced, clearly stated scope — and flag it to Reg.`,
      }
    }
    return {
      recommended_price: published,
      floor_price: floor,
      basis: 'published_value',
      bid: true,
      rationale:
        `The buyer published a ${kind} of ${gbp(published)}. Bid ${gbp(published)} — don't undercut a published figure; ` +
        `buyers budget to spend it, and a much lower price reads as under-scoped.` +
        (valueType === 'estimate' ? ' It is an estimate, so justify the full figure with scope and quality.' : ' Never go above it.') +
        ` Win on quality and method, not price. Cost floor for this scope: ${gbp(floor)}.`,
    }
  }

  const incumbentRate = INCUMBENT_DAY_RATE[input.division] ?? INCUMBENT_DAY_RATE.climate
  const incumbentPrice = days * incumbentRate + subcontract * (1 + SUBCONTRACT_MARKUP)
  const undercut = roundTo(incumbentPrice * (1 - UNDERCUT), 250)

  if (undercut < floor) {
    return {
      recommended_price: floor,
      floor_price: floor,
      basis: 'floor',
      bid: true,
      rationale:
        `No published price. A large incumbent would charge about ${gbp(roundTo(incumbentPrice, 250))}; ` +
        `undercutting by ${UNDERCUT * 100}% would fall below our floor, so price at the floor of ${gbp(floor)}.`,
    }
  }

  return {
    recommended_price: undercut,
    floor_price: floor,
    basis: 'undercut_incumbent',
    bid: true,
    rationale:
      `No published price. A large incumbent would charge about ${gbp(roundTo(incumbentPrice, 250))} ` +
      `(${days} days at ~${gbp(incumbentRate)}/day${subcontract ? ' plus partner cost' : ''}). ` +
      `Bid ${gbp(undercut)}: ${UNDERCUT * 100}% under them and above our floor of ${gbp(floor)}.`,
  }
}
