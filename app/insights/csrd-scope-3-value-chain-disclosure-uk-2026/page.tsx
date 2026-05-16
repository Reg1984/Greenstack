export const metadata = {
  title: "CSRD Scope 3 Reporting: A Practical Guide for UK Businesses in 2026",
  description:
    "After the Omnibus I reforms, which UK businesses are still in scope for CSRD Scope 3 value chain disclosures — and what must they actually do? A clear, actionable guide.",
  publishedAt: "2026-05-16",
  category: "CSRD & Reporting",
  readingTime: "7 min read",
};

export default function Page() {
  return (
    <article className="prose prose-lg max-w-3xl mx-auto py-12 px-4">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-green-600 mb-2">
          CSRD &amp; Reporting
        </p>
        <h1 className="text-4xl font-bold leading-tight mb-4">
          CSRD Scope 3 Reporting: A Practical Guide for UK Businesses in 2026
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          After the Omnibus I reforms narrowed the playing field, many UK businesses assume CSRD no
          longer applies to them. For large UK companies with EU revenues, that assumption is
          dangerous — and the Scope 3 value chain requirements are where most organisations are most
          exposed.
        </p>
        <p className="text-sm text-gray-400 mt-4">16 May 2026 · 7 min read</p>
      </header>

      <section>
        <h2>The Post-Omnibus Landscape: Who Is Still In Scope?</h2>
        <p>
          February 2026 saw the European Council give its final approval to the Omnibus I package —
          a significant simplification of CSRD that raised the employee threshold from 250 to{" "}
          <strong>1,000 employees</strong> and the turnover threshold to{" "}
          <strong>€450 million annual net turnover</strong>. For many smaller businesses, this was
          welcome news. But for large UK companies operating in EU markets, the picture is more
          nuanced.
        </p>
        <p>
          Under the third-country undertakings rules, non-EU parent companies — including UK
          businesses — are in scope for CSRD if they generate more than{" "}
          <strong>€450 million in net EU turnover</strong>, or if they have an EU subsidiary or
          branch generating over €200 million. The stop-the-clock directive delayed some wave-two
          deadlines, but large UK companies with significant EU revenues remain firmly on the hook,
          with reporting on 2025 data due in 2026/27.
        </p>
        <p>
          If your business clears those thresholds, you cannot afford to treat CSRD as a
          &ldquo;European problem.&rdquo; It is a compliance obligation with teeth — and Scope 3 is
          where the teeth are sharpest.
        </p>

        <h2>Why Scope 3 Is the Hard Part</h2>
        <p>
          Under <strong>ESRS E1</strong> (Climate Change), CSRD requires companies to disclose
          gross Scope 3 emissions across all{" "}
          <strong>15 GHG Protocol value chain categories</strong> where those emissions are deemed
          material. This isn&apos;t a tick-box exercise. The standard requires:
        </p>
        <ul>
          <li>
            <strong>Double materiality assessment</strong> — you must demonstrate that you have
            assessed both your impact on climate and climate&apos;s impact on your business, and
            used that assessment to determine which Scope 3 categories are material.
          </li>
          <li>
            <strong>Quantified gross emissions</strong> — carbon credits, offsets, and ETS
            allowances must be excluded from your totals. You are reporting actual emissions, not
            net positions.
          </li>
          <li>
            <strong>Biogenic emissions disclosed separately</strong> — the amended ESRS E1 (2026)
            requires biogenic CO₂ to be broken out from fossil emissions.
          </li>
          <li>
            <strong>Alignment with your climate transition plan</strong> — your Scope 3 disclosures
            must connect coherently to your decarbonisation targets and timeline.
          </li>
        </ul>
        <p>
          The reporting boundary starts from a financial control perspective. If assets operated
          outside that boundary contribute significantly to your emissions profile, you will also
          need to disclose on an operational control basis.
        </p>

        <h2>The 15 Categories: Which Ones Actually Matter?</h2>
        <p>
          Not all 15 Scope 3 categories will be material for every business. But organisations
          consistently underestimate the breadth of what ESRS E1 captures. Here are the five
          categories that most frequently catch UK companies off guard:
        </p>
        <ol>
          <li>
            <strong>Category 1 — Purchased goods and services.</strong> For most manufacturers,
            retailers, and service businesses, this is the single largest Scope 3 category —
            sometimes 70–80% of total emissions. It requires primary supplier data or robust
            spend-based estimates, neither of which can be assembled retrospectively without
            significant effort.
          </li>
          <li>
            <strong>Category 11 — Use of sold products.</strong> Critical for consumer electronics,
            appliances, vehicles, and software businesses. If your product consumes energy in
            use, those lifetime emissions are your Scope 3.
          </li>
          <li>
            <strong>Category 3 — Fuel- and energy-related activities.</strong> This captures
            upstream emissions from energy generation — not just the energy you buy, but the
            emissions created in producing it. Often overlooked because companies assume Scope 2
            covers this entirely.
          </li>
          <li>
            <strong>Category 4 — Upstream transportation and distribution.</strong> Relevant to
            any business relying on third-party logistics. Post-Brexit supply chains involving EU
            customs crossings are particularly complex to model.
          </li>
          <li>
            <strong>Category 15 — Investments.</strong> Mandatory for financial institutions and
            relevant for any business with significant equity stakes. This is the category driving
            CSRD compliance across the investment management sector.
          </li>
        </ol>

        <h2>The Supplier Data Problem — and How to Solve It</h2>
        <p>
          Research from CDP consistently identifies supplier data collection as the primary
          obstacle to credible Scope 3 reporting. Low supplier response rates, inconsistent
          methodologies, and data provided without supporting documentation are endemic. Under
          CSRD, none of those are acceptable excuses — your auditor will want to understand your
          methodology and its limitations.
        </p>
        <p>Here is a practical three-stage approach that works:</p>

        <h3>Stage 1: Spend-based estimates as your baseline (Months 1–2)</h3>
        <p>
          Before you can engage suppliers intelligently, you need to know where to focus. Use
          spend-based emission factors (EXIOBASE or DEFRA conversion factors) to produce a rough
          Scope 3 inventory from your procurement data. This will quickly reveal your &ldquo;hot
          spots&rdquo; — the supplier categories representing the majority of estimated emissions.
          Under ESRS E1, spend-based estimates are acceptable for non-material categories, but you
          must document your methodology.
        </p>

        <h3>Stage 2: Tiered supplier engagement (Months 2–5)</h3>
        <p>
          Focus primary data collection on the top 20–30 suppliers by estimated emissions
          contribution. Embed emissions data-sharing requirements into new supplier contracts now —
          this creates a structural data flow for future reporting years. For existing contracts,
          use CDP Supply Chain questionnaires or bespoke data-sharing portals.
        </p>
        <p>
          Critically, do not just ask suppliers for a number. Ask for their methodology, their
          data sources, and whether their figures have been independently verified. CSRD
          auditors will probe your data quality controls.
        </p>

        <h3>Stage 3: Audit-ready documentation (Months 5–6)</h3>
        <p>
          Your CSRD disclosure needs to explain, for each material Scope 3 category: the
          measurement approach used, the data sources relied upon, any estimation techniques
          applied, and the inherent limitations of the data. This narrative is not optional — it
          is a required disclosure under ESRS E1.
        </p>

        <h2>Connecting Scope 3 to Your Net Zero Commitment</h2>
        <p>
          Here is where many businesses have a credibility problem. A company can publish a
          &ldquo;net zero by 2040&rdquo; commitment — but if its Scope 3 baseline has not been
          properly established, no one can verify whether the trajectory is credible. This is
          exactly what CSRD is designed to address.
        </p>
        <p>
          ESRS E1 requires that your climate transition plan — including your net zero target —
          be directly connected to your quantified Scope 3 inventory. If you have committed to
          net zero across your supply chain, you must disclose:
        </p>
        <ul>
          <li>Your baseline year Scope 3 emissions by category</li>
          <li>Interim reduction targets (typically 2030 and 2035)</li>
          <li>The specific levers — supplier engagement, procurement policy, product redesign
            — by which you will achieve reductions in each material category</li>
          <li>How residual emissions will be addressed (and on what timeline)</li>
        </ul>
        <p>
          Businesses that have made public net zero commitments without completing this
          underlying work are in a particularly exposed position. CSRD creates legal disclosure
          obligations — and greenwashing enforcement under the EU&apos;s Green Claims Directive is
          tightening in parallel.
        </p>

        <h2>Key Deadlines to Plan Around</h2>
        <table className="w-full text-sm border-collapse mt-4">
          <thead>
            <tr className="bg-green-50">
              <th className="border border-gray-200 px-4 py-2 text-left">Company Type</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Reporting Period</th>
              <th className="border border-gray-200 px-4 py-2 text-left">First Report Due</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-200 px-4 py-2">
                Large EU companies (1,000+ employees, €450M+ turnover)
              </td>
              <td className="border border-gray-200 px-4 py-2">FY2025</td>
              <td className="border border-gray-200 px-4 py-2">2026</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-200 px-4 py-2">
                Third-country (UK) companies — EU parent turnover &gt;€450M
              </td>
              <td className="border border-gray-200 px-4 py-2">FY2026</td>
              <td className="border border-gray-200 px-4 py-2">2027</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-4 py-2">
                Third-country subsidiaries/branches — EU turnover &gt;€200M
              </td>
              <td className="border border-gray-200 px-4 py-2">FY2026</td>
              <td className="border border-gray-200 px-4 py-2">2027</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-4 text-sm text-gray-500">
          Note: Deadlines reflect the post-Omnibus I and stop-the-clock position as of May 2026.
          Always verify against the latest EFRAG guidance for your specific entity type.
        </p>

        <h2>Three Actions to Take This Month</h2>
        <ol>
          <li>
            <strong>Run a materiality pre-assessment.</strong> Even a rough spend-based estimate
            across the 15 categories will tell you where to focus. Do this now — you cannot build
            a data collection programme without knowing your hot spots.
          </li>
          <li>
            <strong>Audit your supplier contracts.</strong> Identify which major suppliers have
            emissions data-sharing obligations and which don&apos;t. New contracts signed in 2026
            should include CSRD-aligned data clauses as standard.
          </li>
          <li>
            <strong>Check your net zero claim against your Scope 3 baseline.</strong> If your
            public commitments cover supply chain emissions but your Scope 3 inventory is
            incomplete, you have a regulatory exposure that needs to be addressed before your
            next sustainability report.
          </li>
        </ol>

        <hr className="my-8" />

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Need help with CSRD Scope 3 compliance?
          </h3>
          <p className="text-green-800 mb-4">
            GreenStack AI delivers full CSRD Compliance Reports — including double materiality
            assessment, ESRS E1 mapping, and audit-ready Scope 3 documentation — from{" "}
            <strong>£8,000</strong> (market rate: £16,000). We can typically turn around an initial
            gap analysis within two weeks.
          </p>
          <a
            href="/contact"
            className="inline-block bg-green-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-800 transition-colors"
          >
            Talk to the team →
          </a>
        </div>
      </section>
    </article>
  );
}
