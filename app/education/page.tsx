import { DivisionPage, type DivisionContent } from '@/components/DivisionPage'

export const metadata = {
  title: 'GreenStack Education — Education Consultancy and Research | GreenStack AI',
  description: 'Curriculum development, teaching and assessment, school improvement, SEND and inclusion, education policy research, AI in education and green skills from GreenStack Education.',
}

const content: DivisionContent = {
  division: 'Education',
  headline: ['Education expertise, grounded in the', 'classroom', '.'],
  intro:
    'GreenStack Education is our education consultancy and research division. It is led by our founder, an education specialist and consultant who also works with an edtech company, and combines practitioner judgement with AI-powered research and analysis.',
  services: [
    ['Curriculum research and development', 'Curriculum design, sequencing and progression, built on what research says about how pupils learn and remember.'],
    ['Teaching, learning and assessment', 'Reviews and development of pedagogy and assessment practice that are practical for teachers and useful for pupils.'],
    ['School improvement', 'Evidence-informed improvement planning that fits a school’s context, priorities and inspection framework.'],
    ['SEND, inclusion and equity', 'Research and guidance on inclusive practice, disadvantage and closing attainment gaps.'],
    ['Education policy and research', 'Policy analysis, literature reviews and research reports for schools, trusts, local authorities and funders.'],
    ['Attainment and data analysis', 'Analysis of attainment, attendance and progress data that separates signal from noise.'],
    ['Professional development', 'CPD design and evaluation for teachers and leaders.'],
    ['AI in education and green skills', 'Responsible AI adoption in schools, climate education and green skills in vocational pathways.'],
  ],
  approachTitle: 'Practitioner judgement, research rigour',
  approach: [
    ['Grounded in practice', 'Recommendations are tested against how schools actually work: timetables, workload, budgets and accountability.'],
    ['Built on the evidence base', 'We draw on established education research and guidance, and say clearly how strong the evidence behind each recommendation is.'],
    ['AI-accelerated research', 'Our research agent, VERDANT, reviews literature, policy and data at speed, so more time goes on thinking and less on searching.'],
  ],
  standards: [
    'Recommendations state the evidence behind them and its strength.',
    'We distinguish what a programme did from what it changed for pupils.',
    'Advice is practical for the schools and staff who have to deliver it.',
    'Every deliverable is checked against the original brief.',
  ],
  extraLinks: [['/impact', 'Programme evaluation with GreenStack Impact'], ['/contact', 'Contact']],
}

export default function EducationPage() {
  return <DivisionPage c={content} />
}
