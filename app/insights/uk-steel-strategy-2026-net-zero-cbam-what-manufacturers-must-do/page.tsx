import { ArticleLayout } from '@/components/ArticleLayout'

export const article = {
  title: "UK Steel Strategy 2026: What the EAF Transition and New CBAM Rules Mean for Manufacturers",
  date: "2026-07-21",
  description:
    "The UK Government's 2026 Steel Strategy confirms electric arc furnaces as the future of British steelmaking — and from 1 July 2026, steel import quotas were slashed by 60%. Here's what this seismic shift means for manufacturers, procurement teams, and UK CBAM compliance.",
  author: "VERDANT | GreenStack AI",
  tags: ["Steel", "CBAM", "Net Zero", "UK Steel Strategy", "Manufacturing", "EAF", "Decarbonisation"],
}

export default function Page() {
  return (
    <ArticleLayout article={article}>

      <p>
        The UK Government's long-awaited Steel Strategy landed in July 2026 with two immediate shockwaves 
        for UK manufacturers. First, it formally confirmed <strong>electric arc furnaces (EAFs)</strong> as 
        the future of British steelmaking, accelerating the exit from blast-furnace production. Second — and 
        effective immediately from <strong>1 July 2026</strong> — overall steel import quotas were reduced 
        by <strong>60%</strong>, with a <strong>50% tariff</strong> applied to any volumes above the new 
        lower thresholds.
      </p>

      <p>
        For UK manufacturers that rely on imported steel, this is not an abstract policy announcement. It 
        is a live supply-chain disruption landing on top of an already complex regulatory calendar: the EU 
        CBAM's full financial phase began in January 2026, the UK CBAM launches in January 2027, and ESOS 
        Phase 4 compliance obligations are running in parallel. This post explains what the Steel Strategy 
        actually changes, what it leaves unresolved, and — most importantly — what your business should be 
        doing about it right now.
      </p>

      <h2>What the Steel Strategy Actually Says</h2>

      <p>
        The Strategy's core commitments can be summarised in three planks:
      </p>

      <h3>1. EAFs Are the Endgame</h3>
      <p>
        The Government has explicitly backed electric arc furnace technology as the vehicle for net zero 
        steelmaking in the UK. EAFs use recycled scrap metal rather than virgin iron ore, running on 
        electricity rather than coking coal. At full decarbonisation of the UK grid, an EAF produces 
        steel with near-zero Scope 1 and 2 emissions. British Steel's Scunthorpe operations and 
        Tata Steel's Port Talbot site are both transitioning — a shift that will cut the UK steel 
        sector's direct emissions by an estimated <strong>70–80%</strong> once complete.
      </p>

      <p>
        The practical consequence: the volume of domestically produced blast-furnace steel is falling 
        rapidly, and EAF capacity will take time to scale up. The "scrap gap" — where UK scrap supply 
        is insufficient to feed the new EAF capacity at full output — is a real near-term constraint 
        that will keep certain product grades dependent on imports for several years.
      </p>

      <h3>2. Trade Protection from 1 July 2026</h3>
      <p>
        To prevent high-carbon imported steel flooding UK markets as the EU CBAM raises the cost of 
        exporting to Europe, the Government has cut import quota levels by 60% and introduced a 50% 
        tariff on above-quota volumes. This is a significant protective measure — but it is also a 
        cost shock for any UK manufacturer that has been sourcing steel internationally to fill gaps 
        in domestic supply.
      </p>

      <p>
        Businesses with long-term supply contracts based on pre-July 2026 import assumptions may find 
        those contracts suddenly uneconomic or logistically undeliverable. Procurement teams need to 
        review affected contracts immediately.
      </p>

      <h3>3. Green Steel Market Development</h3>
      <p>
        The Strategy includes commitments to develop market demand for low-carbon steel — particularly 
        through public procurement requirements, mandated embodied-carbon disclosure on government 
        contracts, and a roadmap for steel product standards that will, in time, create a premium 
        market for EAF-produced material. This matters for manufacturers: it signals that 
        <em>embodied carbon in your steel supply chain will become a competitive differentiator</em>, 
        not just a compliance box.
      </p>

      <h2>The CBAM Dimension: Two Mechanisms, One Supply Chain Headache</h2>

      <p>
        The Steel Strategy lands at a moment when UK manufacturers face a double-CBAM compliance 
        challenge that is genuinely complex.
      </p>

      <h3>EU CBAM — Already Live</h3>
      <p>
        From 1 January 2026, the EU CBAM entered its full financial phase. UK steel exporters selling 
        to EU customers are now subject to CBAM charges — meaning EU importers of UK steel must purchase 
        CBAM certificates to cover the embedded carbon in the steel they receive. In practice, this 
        means EU buyers are pushing carbon-intensity data requirements back up the supply chain to 
        UK producers. If you manufacture steel or steel-containing products and export to the EU, 
        your customers are already asking for facility-level Scope 1 and 2 emissions data. If you 
        can't provide it, you risk losing those contracts.
      </p>

      <p>
        Critically, UK steel producers receive <strong>no exemption</strong> from EU CBAM — and will 
        continue to receive none until UK-EU ETS linking is complete, which remains politically 
        unresolved as of mid-2026.
      </p>

      <h3>UK CBAM — Launching January 2027</h3>
      <p>
        On the import side, the UK's own Carbon Border Adjustment Mechanism launches on 
        <strong>1 January 2027</strong>. UK importers of steel, aluminium, cement, ceramics, 
        fertilisers, glass, and hydrogen will be required to purchase UK CBAM certificates 
        corresponding to the embedded greenhouse gas emissions in their imports.
      </p>

      <p>
        The certificate price tracks the UK ETS — which has been trading in the 
        <strong>£40–£55 per tonne CO₂e</strong> range through early-to-mid 2026. For a manufacturer 
        importing 5,000 tonnes of steel with an emissions intensity of 1.8 tCO₂e per tonne, the 
        notional annual CBAM liability is approximately <strong>£450,000</strong> at a £50/tonne 
        ETS price — before any deduction for carbon costs paid at origin.
      </p>

      <p>
        The Steel Strategy's new import quota cuts compound this: less quota availability means 
        manufacturers who do import will pay the tariff <em>on top of</em> CBAM certificate costs 
        on above-quota volumes. The combined cost impact could be transformative for steel-intensive 
        industries such as construction, automotive, and engineering.
      </p>

      <h2>The Scrap Gap and Its Implications for Net Zero Planning</h2>

      <p>
        EAF steelmaking is good for the climate but creates a structural constraint: it requires 
        large volumes of high-quality ferrous scrap. The UK currently exports a significant 
        proportion of its scrap, and domestic processing infrastructure is insufficient to capture 
        and prepare all available material for EAF feedstock.
      </p>

      <p>
        This matters for net zero planning in two ways. First, UK manufacturers that currently rely 
        on virgin steel will face a period where domestically produced <em>low-carbon</em> steel is 
        in short supply — driving them toward imports at exactly the moment that imports are becoming 
        more expensive (due to tariffs and CBAM). Second, manufacturers that generate steel scrap 
        as a production by-product have a genuine commercial opportunity: scrap is becoming a 
        strategically valuable material, and building circular supply chain arrangements with domestic 
        EAF producers can generate both carbon and cost benefits.
      </p>

      <h2>What Manufacturers Need to Do Now: A Practical Checklist</h2>

      <h3>Immediate (July–August 2026)</h3>
      <ul>
        <li>
          <strong>Review import contracts against new quota levels.</strong> Identify any supply 
          agreements relying on above-quota import volumes that will now attract the 50% tariff. 
          Quantify the cost impact and flag to procurement leadership immediately.
        </li>
        <li>
          <strong>Map your steel supply by origin.</strong> Which volumes come from EU suppliers 
          (unaffected by UK quota changes but subject to EU CBAM)? Which from non-EU origins 
          (subject to UK tariffs and, from January 2027, UK CBAM)?
        </li>
        <li>
          <strong>Start supplier carbon-data conversations.</strong> EU CBAM-driven requests are 
          already landing in supplier inboxes. Use the EU CBAM compliance need as the opening 
          to request facility-level Scope 1 and 2 data — the same data you'll need for UK CBAM 
          in January.
        </li>
      </ul>

      <h3>September–November 2026</h3>
      <ul>
        <li>
          <strong>Model your UK CBAM exposure.</strong> Using supplier-provided or default 
          emissions intensity data, calculate your expected annual CBAM liability from 
          January 2027. This number needs to be in your 2027 budget.
        </li>
        <li>
          <strong>Assess domestic sourcing alternatives.</strong> As UK EAF capacity comes online, 
          domestic low-carbon steel may become commercially competitive with import-plus-CBAM costs. 
          Run a sourcing scenario analysis.
        </li>
        <li>
          <strong>Register with HMRC's UK CBAM portal.</strong> HMRC is expected to open 
          registration in the second half of 2026. Early registration avoids last-minute 
          system issues at the January 2027 go-live.
        </li>
        <li>
          <strong>Integrate embodied carbon into procurement criteria.</strong> If you bid for 
          government contracts, embodied-carbon disclosure requirements are coming. Building 
          supplier carbon-intensity data into your procurement scoring now will put you ahead 
          of competitors.
        </li>
      </ul>

      <h3>2027 and Beyond</h3>
      <ul>
        <li>
          <strong>Develop a green steel sourcing strategy.</strong> As UK EAF output grows and 
          global low-carbon steel production scales up (particularly in Europe and North America), 
          manufacturers with established low-carbon procurement frameworks will face lower CBAM 
          liabilities and be better positioned for government contract requirements.
        </li>
        <li>
          <strong>Incorporate CBAM costs into your Net Zero Roadmap.</strong> The financial 
          impact of carbon pricing on your supply chain is a material factor in any credible 
          transition plan. If your Net Zero Roadmap was written before 2025, it almost certainly 
          needs updating.
        </li>
      </ul>

      <h2>The Bigger Picture: From Cost Compliance to Strategic Advantage</h2>

      <p>
        It is tempting to frame the Steel Strategy's CBAM and tariff implications purely as a cost 
        burden. But manufacturers that move fast will find competitive advantage on the other side.
      </p>

      <p>
        Embodied carbon in supply chains is rapidly becoming a procurement criterion for large 
        infrastructure projects, public sector contracts, and export customers in carbon-conscious 
        markets. The manufacturers that can demonstrate low-carbon steel procurement — with the 
        data to prove it — will win contracts that competitors cannot. The Steel Strategy, the 
        EU CBAM, and the UK CBAM together are accelerating a market transition that was coming 
        regardless. The question is whether your business leads it or reacts to it.
      </p>

      <h2>How GreenStack AI Can Help</h2>

      <p>
        GreenStack AI provides practical, cost-effective support for UK manufacturers navigating 
        the Steel Strategy's compliance implications:
      </p>

      <ul>
        <li>
          <strong>CBAM Compliance Assessment — £5,750:</strong> Full import portfolio audit, 
          financial exposure modelling, supplier data readiness assessment, and step-by-step 
          CBAM process design. Delivered in four weeks.
        </li>
        <li>
          <strong>Net Zero Roadmap — £11,250:</strong> A science-aligned transition plan that 
          integrates CBAM exposure, supply chain decarbonisation, and UK SRS disclosure 
          requirements. Independently benchmarked at half the market rate.
        </li>
        <li>
          <strong>ESOS Phase 4 Energy Audit — £3,750:</strong> For manufacturers with ESOS 
          obligations, an energy audit that feeds directly into your carbon reduction strategy 
          and Net Zero Roadmap.
        </li>
      </ul>

      <p>
        Larger consultancies charge £12,000–£20,000 for equivalent CBAM and net zero advisory 
        work. We deliver faster and at half the cost because we've built AI-powered analysis tools 
        specifically for UK regulatory compliance.
      </p>

      <p>
        <strong>The July 2026 quota changes are already in force. January 2027 is six months away.</strong> 
        If you haven't started your CBAM readiness work or stress-tested your steel sourcing strategy 
        against the new tariff regime, the time to act is now.
      </p>

      <p>
        <a href="mailto:hello@greenstack.ai">Contact GreenStack AI</a> to book a free 30-minute 
        scoping call with our manufacturing and CBAM specialists.
      </p>

    </ArticleLayout>
  )
}
