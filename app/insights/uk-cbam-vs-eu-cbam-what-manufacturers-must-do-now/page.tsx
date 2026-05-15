import { ArticleLayout } from '@/components/ArticleLayout'

export const article = {
  title: "UK CBAM vs EU CBAM: What Manufacturers Must Do Before January 2027",
  date: "2026-05-15",
  description:
    "The UK Carbon Border Adjustment Mechanism launches in January 2027. If you import steel, aluminium, ceramics, cement, glass, or hydrogen into Great Britain, the clock is ticking. Here's exactly what you need to do — and when.",
  author: "VERDANT | GreenStack AI",
  tags: ["CBAM", "Carbon Border Adjustment", "Manufacturing", "Net Zero", "Compliance"],
}

export default function Page() {
  return (
    <ArticleLayout article={article}>

      <p>
        The UK Carbon Border Adjustment Mechanism (UK CBAM) comes into force on <strong>1 January 2027</strong>. 
        That gives manufacturers, importers, and procurement teams fewer than eight months to understand their 
        exposure, gather embedded-carbon data from overseas suppliers, and build internal reporting processes 
        from scratch. For many businesses, this is more work than it sounds.
      </p>

      <p>
        This post cuts through the noise. We explain exactly how UK CBAM works, how it differs from the EU 
        equivalent already in its transitional phase, and — critically — what practical steps you should be 
        taking right now.
      </p>

      <h2>What Is UK CBAM and Why Does It Exist?</h2>

      <p>
        UK CBAM is a carbon pricing mechanism applied at the border to imports of carbon-intensive goods. 
        Its purpose is twofold: to prevent <em>carbon leakage</em> (where UK manufacturers lose competitive 
        advantage to overseas producers not subject to the UK Emissions Trading Scheme) and to incentivise 
        trading partners to reduce the carbon intensity of their production.
      </p>

      <p>
        From 1 January 2027, UK importers of the following goods will be required to purchase UK CBAM 
        certificates corresponding to the embedded greenhouse gas emissions in their imports:
      </p>

      <ul>
        <li><strong>Aluminium</strong> (primary and secondary, plus certain downstream products)</li>
        <li><strong>Cement</strong></li>
        <li><strong>Ceramics</strong></li>
        <li><strong>Fertilisers</strong></li>
        <li><strong>Glass</strong></li>
        <li><strong>Hydrogen</strong></li>
        <li><strong>Iron and Steel</strong> (including certain processed products)</li>
      </ul>

      <p>
        The certificate price will be linked to the UK ETS allowance price — which has been trading broadly 
        in the <strong>£40–£55 per tonne CO₂e</strong> range through early 2026. This is a real and material 
        cost for importers of high-volume, carbon-intensive materials.
      </p>

      <h2>How UK CBAM Differs from EU CBAM</h2>

      <p>
        The EU CBAM entered its transitional (reporting-only) phase in October 2023 and moves to full 
        financial liability from <strong>1 January 2026</strong>. UK CBAM follows a broadly similar 
        architecture but with important differences that businesses operating in both markets must 
        understand:
      </p>

      <h3>1. Scope of Covered Goods</h3>
      <p>
        The EU CBAM currently covers iron and steel, aluminium, cement, fertilisers, electricity, and 
        hydrogen. The UK scope is closely aligned but <strong>adds ceramics and glass</strong> from day one 
        — a broader initial perimeter that will catch more businesses unprepared, particularly in 
        construction and packaging supply chains.
      </p>

      <h3>2. Certificate Mechanism vs. Declaratory System</h3>
      <p>
        Under EU CBAM, importers purchase CBAM certificates linked to the EU ETS carbon price. The UK 
        system works analogously — UK CBAM certificates priced against the UK ETS — but the registries, 
        portals, and verification bodies are entirely separate. Compliance with one does <em>not</em> 
        satisfy the other. UK businesses that export to the EU and also import covered goods into Great 
        Britain face parallel compliance obligations with different data requirements and filing portals.
      </p>

      <h3>3. Carbon Price Adjustment for Third-Country Carbon Costs</h3>
      <p>
        Both mechanisms allow importers to deduct carbon costs already paid in the country of production. 
        The UK rules on how this deduction is calculated and evidenced differ in procedural detail from 
        the EU approach. Getting this wrong is costly: over-declaring means buying too many certificates; 
        under-declaring creates regulatory liability.
      </p>

      <h3>4. Northern Ireland</h3>
      <p>
        This is a live complexity. Goods moving from the EU into Northern Ireland are not subject to UK 
        CBAM because Northern Ireland remains within the EU single market for goods under the Windsor 
        Framework. Businesses with supply chains routed through Northern Ireland need specific legal 
        advice on CBAM exposure — it is genuinely nuanced.
      </p>

      <h2>The Embedded Emissions Data Problem</h2>

      <p>
        Here is the practical challenge that will trip up the majority of importers: <strong>you need 
        verified embedded carbon data from your overseas suppliers</strong>, and most of them won't 
        have it ready.
      </p>

      <p>
        UK CBAM requires importers to report the actual embedded greenhouse gas emissions in their 
        imported goods — not an industry average, not an estimate, but supplier-specific production 
        data verified against agreed methodology. HMRC has indicated that default values will be 
        available as a fallback, but these are likely to be set conservatively high — meaning reliance 
        on defaults will <em>cost you more</em> than gathering real data from your supply chain.
      </p>

      <p>
        For a steel importer sourcing from Turkey, India, or China, getting reliable emissions intensity 
        data per tonne of material — broken down by Scope 1 and 2 at production facility level — requires 
        active supplier engagement starting now. Suppliers themselves may need to implement energy 
        monitoring or emissions accounting systems, which take months to bed in.
      </p>

      <h2>What You Should Be Doing Right Now — A Practical Timeline</h2>

      <h3>May–June 2026: Map Your Exposure</h3>
      <ul>
        <li>Audit your import portfolio: which commodity codes fall within UK CBAM scope?</li>
        <li>Quantify volumes and country of origin for each covered product category.</li>
        <li>Estimate potential CBAM liability using the current UK ETS price and industry-average 
        emission intensity figures — this gives your financial planning team a working number.</li>
        <li>Identify which suppliers in which countries will need to provide embedded carbon data.</li>
      </ul>

      <h3>July–September 2026: Supplier Engagement</h3>
      <ul>
        <li>Issue supplier questionnaires requesting facility-level Scope 1 and 2 emissions data, 
        production volumes, and any existing carbon pricing paid locally.</li>
        <li>Prioritise high-volume, high-intensity suppliers first — the 80/20 rule applies.</li>
        <li>Assess which suppliers will struggle: Chinese steel mills and South Asian aluminium 
        smelters vary enormously in data maturity.</li>
        <li>Begin registering with HMRC's UK CBAM registry portal once it opens (expected 
        mid-2026 based on government timelines).</li>
      </ul>

      <h3>October–December 2026: Build Internal Processes</h3>
      <ul>
        <li>Implement an internal CBAM data management process — spreadsheet-based approaches 
        will work at low volume but will not scale.</li>
        <li>Train procurement, finance, and logistics teams on CBAM certificate purchasing mechanics.</li>
        <li>Run a dry-run calculation for Q4 imports to stress-test your data and reporting process 
        before live obligations begin.</li>
        <li>Engage a compliance adviser to review your embedded emissions methodology and verify 
        you are not systematically over- or under-declaring.</li>
      </ul>

      <h3>January 2027: Go Live</h3>
      <ul>
        <li>UK CBAM declarations and certificate purchases begin from the first import of covered 
        goods in the new year.</li>
        <li>Quarterly reporting obligations apply initially — deadlines, late payment penalties, 
        and the verification audit regime will all be live from day one.</li>
      </ul>

      <h2>The Financial Stakes Are Real</h2>

      <p>
        To put numbers on this: a mid-sized UK manufacturer importing 10,000 tonnes of steel per year 
        from a supplier with an emissions intensity of 1.8 tCO₂e per tonne of steel faces a notional 
        CBAM liability of approximately <strong>£900,000 per year</strong> at a £50/tonne UK ETS price. 
        If that same supplier already pays a local carbon price equivalent to £15/tonne, the net 
        liability falls to around <strong>£630,000</strong> — but only if you can evidence that deduction.
      </p>

      <p>
        These are not trivial sums. They will hit procurement budgets, reshape sourcing decisions, 
        and in some cases determine whether existing supplier relationships remain commercially viable.
      </p>

      <h2>How GreenStack AI Can Help</h2>

      <p>
        GreenStack AI offers a <strong>UK CBAM Compliance Assessment for £5,750</strong> — delivered in 
        four weeks and covering:
      </p>
      <ul>
        <li>Full import portfolio audit against UK CBAM commodity codes</li>
        <li>Financial exposure modelling at current and projected UK ETS prices</li>
        <li>Supplier data readiness assessment and engagement templates</li>
        <li>Step-by-step internal process design for CBAM data management and certificate purchasing</li>
        <li>Regulatory risk review including Northern Ireland implications where relevant</li>
      </ul>

      <p>
        Larger consultancies charge £12,000–£18,000 for equivalent work. We deliver faster, leaner, 
        and at half the cost — because we've built AI-powered analysis tools specifically for UK 
        regulatory compliance.
      </p>

      <p>
        <strong>January 2027 is closer than it feels.</strong> If you import any of the covered 
        commodities and haven't started your CBAM readiness work, the time to act is now.
      </p>

      <p>
        <a href="mailto:hello@greenstack.ai">Get in touch with GreenStack AI</a> to book a free 
        30-minute CBAM scoping call.
      </p>

    </ArticleLayout>
  )
}
