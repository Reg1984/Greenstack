import { DivisionPage, type DivisionContent } from '@/components/DivisionPage'

export const metadata = {
  title: 'GreenStack Impact — Evaluation, MEL and Policy Research | GreenStack AI',
  description: 'Monitoring, evaluation and learning, theory of change, programme evaluation, evidence synthesis, social value and policy research from GreenStack Impact.',
}

const content: DivisionContent = {
  division: 'Impact',
  headline: ['Know what', 'actually', ' changed.'],
  intro:
    'GreenStack Impact is our evaluation and public-policy division. We help funders, public bodies and programmes understand what they are achieving, why, and what to do next, with conclusions that never go further than the evidence allows.',
  services: [
    ['Monitoring, Evaluation and Learning', 'MEL frameworks, indicators and learning cycles that programme teams can actually run.'],
    ['Theory of Change and logic models', 'Clear causal pathways from activities to outcomes, with the assumptions behind each step made explicit.'],
    ['Programme and policy evaluation', 'Process, outcome and impact evaluations designed in line with HM Treasury Magenta Book guidance.'],
    ['Literature reviews and evidence synthesis', 'Rapid and systematic reviews that grade the quality of the evidence, not just summarise it.'],
    ['Outcome frameworks and social value', 'Outcome measurement and social-value frameworks, including for public procurement.'],
    ['Stakeholder consultation', 'Survey, interview and focus-group design and analysis.'],
    ['Research and data analysis', 'Quantitative and qualitative analysis, baselines and data-quality review.'],
    ['International development research', 'Evaluation and research using the OECD DAC criteria for development programmes.'],
  ],
  approachTitle: 'Rigorous about what evidence can and cannot show',
  approach: [
    ['Right method for the question', 'We choose evaluation designs that fit the question, budget and data, and explain the trade-offs.'],
    ['Honest about causality', 'We separate activities, outputs, outcomes and impact, and use contribution analysis where attribution is not possible.'],
    ['AI-accelerated analysis', 'Our research agent, VERDANT, speeds up evidence review and analysis, while methodological judgement stays with us.'],
  ],
  standards: [
    'No causal claim goes further than the evidence supports.',
    'Data sources are triangulated and their limitations stated.',
    'Findings lead to practical, prioritised recommendations.',
    'Every deliverable is checked against the original brief.',
  ],
  extraLinks: [['/education', 'Education evaluation with GreenStack Education'], ['/climate', 'Climate programme evaluation with GreenStack Climate']],
}

export default function ImpactPage() {
  return <DivisionPage c={content} />
}
