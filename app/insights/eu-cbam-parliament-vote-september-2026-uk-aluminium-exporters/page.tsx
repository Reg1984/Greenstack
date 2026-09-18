import { ArticleLayout } from '@/components/ArticleLayout'

export const article = {
  title: "EU Parliament's CBAM Vote: What UK Aluminium Exporters Must Do Right Now",
  date: "2026-09-18",
  description:
    "The European Parliament voted this week to strengthen — not soften — the EU Carbon Border Adjustment Mechanism. Emergency suspension is off the table. Aluminium scope is widening. Here's what UK exporters need to do before their EU customers start pricing it into contracts.",
  author: "VERDANT | GreenStack AI",
  tags: ["CBAM", "Aluminium", "EU Trade", "Carbon Border Adjustment", "UK Manufacturing", "Net Zero"],
}

export default function Page() {
  return (
    <ArticleLayout article={article}>

      <p>
        On 17 September 2026, the European Parliament voted on a significant package of amendments to the EU 
        Carbon Border Adjustment Mechanism (CBAM). The headline: the proposed emergency suspension clause — 
        which would have allowed the carbon border levy to be paused during periods of significant import 
        cost pressure — has been removed. The mechanism is being strengthened, not softened. And for UK 
        aluminium manufacturers exporting to Europe, the implications are immediate and practical.
      </p>

      <p>
        This post explains what changed, why it matters specifically to UK aluminium exporters, and what 
        you should be doing in the next 90 days.
      </p>

      <h2>What the European Parliament Actually Voted On</h2>

      <p>
        The EU CBAM moved into its full financial compliance phase on <strong>1 January 2026</strong>. 
        Since that date, authorised EU declarants importing CBAM-covered goods — iron and steel, 
        aluminium, cement, fertilisers, electricity, and hydrogen — have been required to purchase CBAM 
        certificates corresponding to the embedded carbon emissions in their imports. The first annual 
        declaration and certificate surrender deadline is <strong>30 September 2027</strong>, covering 
        all imports during 2026.
      </p>

      <p>
        Earlier this year, the European Commission had proposed an emergency mechanism: a lever that would 
        allow the CBAM levy to be temporarily suspended where it caused significant price rises in imported 
        goods — for example, during supply shocks or periods of exceptional commodity inflation. This 
        originated partly from pressure related to the agricultural sector.
      </p>

      <p>
        The European Parliament has now voted to remove this emergency brake. MEPs argued — with 
        justification — that a suspension mechanism would undermine the entire logic of CBAM: if 
        importers knew the levy could be paused under pressure, it would reduce the incentive for 
        overseas producers to decarbonise, and create a pathway for carbon-intensive imports exactly 
        when European industry was under cost pressure. As an alternative, Parliament has backed 
        using CBAM revenues to compensate affected European industries.
      </p>

      <p>
        Parliament has also voted to <strong>tighten the aluminium-specific provisions</strong>. The 
        changes reduce the threshold at which the levy applies to smaller aluminium shipments and 
        extend coverage to post-consumer aluminium scrap — closing a loophole where CBAM charges 
        could be avoided by routing aluminium through scrap channels. The wider legislative package 
        is also expected to extend CBAM to additional downstream aluminium products as negotiations 
        progress.
      </p>

      <h2>Why This Matters More for Aluminium Than Any Other Sector</h2>

      <p>
        Of all the CBAM-covered commodities, aluminium is the one where the embedded carbon story is 
        most complex — and where UK exporters are most exposed.
      </p>

      <p>
        Aluminium smelting is enormously energy-intensive. The carbon intensity of primary aluminium 
        production varies by a factor of five or more depending on the electricity grid used in 
        smelting: aluminium produced using hydroelectric power in Norway or Iceland has a fraction 
        of the embedded emissions of aluminium smelted using coal-fired electricity in China or 
        parts of the Gulf. Secondary (recycled) aluminium, by contrast, uses roughly 5% of the 
        energy of primary production.
      </p>

      <p>
        For UK aluminium die-casters, foundries, and fabricators supplying the European market, 
        this creates an immediate practical challenge: <strong>your EU customers are now liable for 
        CBAM costs based on the embedded carbon intensity of the aluminium in the goods you ship 
        them</strong>. If you cannot provide verified embedded emissions data — broken down by 
        production method, energy source, and facility — your EU customers must use conservative 
        default values set by the European Commission. Those default values are deliberately high, 
        to incentivise real data collection. Using them costs your customers more, and they will 
        price that cost back into your next contract negotiation.
      </p>

      <p>
        This week's vote makes clear that this pressure is not going away. There will be no emergency 
        valve. The mechanism is permanent, and its scope is widening.
      </p>

      <h2>The Data Chain Problem: Where UK Exporters Get Caught</h2>

      <p>
        Here is the chain of obligation that flows from EU CBAM to a typical UK aluminium exporter:
      </p>

      <ol>
        <li>
          <strong>EU importer registers as a CBAM declarant</strong> and must report the embedded 
          GHG emissions in all aluminium goods they import from non-EU countries (including the UK, 
          post-Brexit).
        </li>
        <li>
          <strong>To report actual emissions (rather than defaults)</strong>, the EU importer needs 
          verified production data from the UK manufacturer — specifically Scope 1 and Scope 2 
          emissions at the production facility level, plus the production volume of the goods supplied.
        </li>
        <li>
          <strong>The UK manufacturer</strong> therefore needs to have this data ready, verified, 
          and in a format the EU declarant can submit to the CBAM registry. Without it, the EU 
          customer is stuck using defaults — and will push the cost back to you.
        </li>
        <li>
          <strong>The UK manufacturer's own embedded carbon</strong> depends partly on the source 
          of its aluminium feedstock. If you are using primary aluminium ingot from high-carbon 
          producers, your embedded emissions figure will be high regardless of how efficiently 
          you run your foundry.
        </li>
      </ol>

      <p>
        This means the data chain extends <em>upstream</em> as well as downstream: UK aluminium 
        manufacturers need embedded emissions data from their own material suppliers, not just 
        from their own operations. For businesses sourcing ingot from multiple suppliers across 
        different countries — common in the industry — this is non-trivial.
      </p>

      <h2>What the HMRC Carbon Price Verification Form Means in Practice</h2>

      <p>
        There is one potential offset available to UK exporters: if the aluminium you produce 
        was made using feedstock from a country that already has a domestic carbon price (for 
        example, the UK ETS), your EU customer may be able to claim a carbon price adjustment 
        — reducing their CBAM certificate obligation proportionally.
      </p>

      <p>
        HMRC has introduced a <strong>Carbon Price Verification Form</strong> as part of its 
        guidance package. This form must be completed by an independent, accredited verifier of 
        the installation that manufactured the goods. It is the formal mechanism for claiming 
        credit against the EU CBAM liability for carbon already priced in the UK.
      </p>

      <p>
        For UK aluminium producers operating under the UK ETS, this is a meaningful opportunity: 
        it can significantly reduce the net CBAM cost your EU customers face, making your products 
        more competitively priced versus non-UK, non-EU alternatives that carry no carbon price 
        credit. But you need a verified, accredited verifier to complete the form — you cannot 
        self-certify.
      </p>

      <h2>The UK's Own CBAM: January 2027</h2>

      <p>
        Overlaid on all of this is the UK's own Carbon Border Adjustment Mechanism, which launches 
        on <strong>1 January 2027</strong> — fewer than 16 weeks away from today. UK CBAM covers 
        the same core commodities as EU CBAM (including aluminium) and adds ceramics and glass. 
        It applies to goods imported into Great Britain from countries without an equivalent 
        carbon price.
      </p>

      <p>
        For UK aluminium manufacturers who import primary ingot or semi-finished aluminium from 
        outside the UK, this creates a <em>direct financial liability</em> beginning in January — 
        not just a data obligation to customers. At a UK ETS price of approximately <strong>£45–£55 
        per tonne CO₂e</strong>, a foundry importing 500 tonnes per month of high-carbon primary 
        aluminium (emissions intensity ~12–15 tCO₂e per tonne of aluminium) faces a notional UK 
        CBAM cost of <strong>£2.7M–£4.1M per year</strong> before any carbon price deductions.
      </p>

      <p>
        That is a number large enough to reshape procurement decisions, supplier relationships, 
        and pricing models. The businesses that have mapped their exposure and engaged their 
        suppliers now will be in a fundamentally stronger position than those that wait until 
        Q1 2027.
      </p>

      <h2>Practical Steps: What to Do Before the End of September</h2>

      <p>
        Given where we are — mid-September 2026, with EU CBAM in full financial phase and UK CBAM 
        16 weeks away — here is a prioritised action list:
      </p>

      <h3>1. Map Your EU Export Exposure (This Week)</h3>
      <p>
        Pull your EU customer list and identify which shipments contain CBAM-covered aluminium 
        goods. Check commodity codes against the EU CBAM annex. Quantify annual volumes per 
        customer. This takes a day and tells you immediately how large the issue is.
      </p>

      <h3>2. Contact Your Top 5 EU Customers</h3>
      <p>
        Ask them whether they have registered as CBAM declarants and whether they have already 
        used default emissions values for your goods in their Q1/Q2 2026 reporting. If they 
        have — and many will have — they have already incurred higher costs than necessary, and 
        they know it. Getting verified data to them now reduces their 2026 cost and strengthens 
        the relationship.
      </p>

      <h3>3. Calculate Your Own Facility-Level Scope 1 and 2 Emissions</h3>
      <p>
        For EU CBAM purposes, your EU customers need your facility-level Scope 1 (direct combustion) 
        and Scope 2 (purchased electricity) emissions, expressed as tCO₂e per tonne of aluminium 
        product shipped. If you have an ISO 14001 or energy management system in place, much 
        of this data already exists — it just needs extracting and formatting correctly.
      </p>

      <h3>4. Engage an Accredited Verifier for the HMRC Carbon Price Form</h3>
      <p>
        If you operate under the UK ETS, instructing an accredited verifier to complete the Carbon 
        Price Verification Form for your installation is one of the highest-value actions available. 
        It converts your UK ETS compliance cost into a tangible commercial advantage with EU customers.
      </p>

      <h3>5. Map Your Import Exposure for UK CBAM</h3>
      <p>
        Identify your aluminium ingot and semi-finished material suppliers by country of origin. 
        For each, assess whether that country has an equivalent carbon price mechanism (which would 
        allow a deduction) or not. This determines your UK CBAM financial exposure from January.
      </p>

      <h2>How GreenStack AI Can Help</h2>

      <p>
        GreenStack AI's <strong>CBAM Compliance Assessment (£5,750)</strong> is designed specifically 
        for UK manufacturers in exactly this position. Delivered in four weeks, it covers:
      </p>

      <ul>
        <li>Full export portfolio audit against EU CBAM commodity codes, with embedded carbon exposure 
        modelling per customer and product line</li>
        <li>Facility-level Scope 1 and 2 emissions calculation in the format required for EU CBAM 
        declarants</li>
        <li>Carbon price verification assessment — identifying whether and how to pursue UK ETS 
        deductions via the HMRC Carbon Price Verification Form</li>
        <li>UK CBAM import exposure analysis for January 2027, including per-supplier default 
        vs. actual data assessment</li>
        <li>A customer-ready data pack you can issue to EU buyers immediately to reduce their 
        default-value CBAM costs</li>
      </ul>

      <p>
        Major consultancies charge £12,000–£18,000 for equivalent work. We deliver at half the 
        price because we have built AI-powered analysis tools specifically for UK regulatory 
        compliance — which means less time billing hours to do things that can be automated, 
        and more value in the analysis and advice that genuinely requires expertise.
      </p>

      <p>
        <strong>The EU Parliament's vote this week removed the safety net.</strong> CBAM is here, 
        it is strengthening, and its aluminium scope is widening. The window to get ahead of 
        it — before EU customers start renegotiating contracts based on embedded carbon costs — 
        is right now.
      </p>

      <p>
        <a href="mailto:hello@greenstack.ai">Contact GreenStack AI</a> to book a free 30-minute 
        CBAM scoping call. We can usually turn around an initial exposure assessment within 
        a week of engagement.
      </p>

    </ArticleLayout>
  )
}
