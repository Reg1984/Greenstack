import { DivisionPage, type DivisionContent } from '@/components/DivisionPage'

export const metadata = {
  title: 'GreenStack Climate — Carbon, Net Zero and Sustainability Consultancy | GreenStack AI',
  description: 'Carbon accounting, decarbonisation planning, local-authority climate strategy, energy efficiency, CBAM and sustainability reporting from GreenStack Climate.',
}

const content: DivisionContent = {
  division: 'Climate',
  headline: ['Climate intelligence you can', 'defend', '.'],
  intro:
    'GreenStack Climate is our environmental and sustainability consultancy. We help public bodies, manufacturers and organisations measure emissions, plan decarbonisation and meet fast-moving regulation, with every figure traceable to its source.',
  services: [
    ['Carbon emissions reporting', 'Scope 1, 2 and 3 footprints built on the GHG Protocol and current UK Government (DESNZ) conversion factors, with every line traceable to the factor and formula behind it.'],
    ['Decarbonisation and net zero planning', 'Net zero roadmaps and carbon reduction plans with quick wins, longer-term interventions, costs and milestones, aligned to SBTi where relevant.'],
    ['Local-authority climate strategies', 'Climate action plans, area-wide emissions baselines and delivery frameworks for councils and public bodies.'],
    ['Energy-efficiency analysis', 'Whole-organisation energy reviews and ESOS-ready analysis that identify where energy and money are lost.'],
    ['CBAM and carbon border compliance', 'Embedded-emissions reporting and readiness for the EU CBAM and the UK CBAM launching in January 2027.'],
    ['Sustainability reporting', 'Reporting aligned to UK SRS / ISSB, CSRD and ESRS, TCFD, SECR and GRI, plus green-claims compliance.'],
    ['Biodiversity and nature recovery', 'Research and strategy support on biodiversity net gain, nature recovery and nature-related disclosure.'],
    ['Sustainable procurement and programme evaluation', 'Green procurement policy, supply-chain decarbonisation and evaluation of climate programmes.'],
  ],
  approachTitle: 'Research-led, regulation-current, AI-accelerated',
  approach: [
    ['Regulation tracked daily', 'Our AI research agent, VERDANT, monitors GOV.UK, the EU, the FCA, EFRAG and SBTi every morning, so advice reflects the rules as they stand today.'],
    ['Traceable calculations', 'Emissions figures link to the exact published factor and stored formula used. Nothing is estimated without saying so.'],
    ['Specialists where required', 'Where work needs an accredited assessor, such as an ESOS Lead Assessor or ISO 14064 verifier, we say so and bring in vetted partners.'],
  ],
  standards: [
    'Every material figure and claim is sourced and dated.',
    'Assumptions and data gaps are stated, not hidden.',
    'We say when regulated or accredited professional sign-off is needed.',
    'Recommendations are costed and prioritised, not generic.',
  ],
  extraLinks: [['/cbam', 'CBAM advisory'], ['/credentials', 'VERDANT knowledge base'], ['/partners', 'Partner network'], ['/insights#climate', 'Climate insights']],
}

export default function ClimatePage() {
  return <DivisionPage c={content} />
}
