import { notFound } from 'next/navigation'
import { ArticleLayout } from '@/components/ArticleLayout'
import { getMarkdownInsight, getMarkdownSlugs, divisionName } from '@/lib/insights'
import { renderMarkdown } from '@/lib/markdown'

// Insights published as content/insights/<slug>.md. Built statically: older
// hand-built pages in app/insights/<slug>/ take precedence over this route.
export const dynamicParams = false

export function generateStaticParams() {
  return getMarkdownSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const insight = getMarkdownInsight((await params).slug)
  if (!insight) return {}
  return {
    title: `${insight.title} | GreenStack ${divisionName(insight.division)}`,
    description: insight.description,
    keywords: insight.tags.join(', '),
    openGraph: { title: insight.title, description: insight.description, type: 'article', publishedTime: insight.date },
  }
}

export default async function InsightPage({ params }: { params: Promise<{ slug: string }> }) {
  const insight = getMarkdownInsight((await params).slug)
  if (!insight) notFound()
  return (
    <ArticleLayout article={{ ...insight, author: 'VERDANT | GreenStack AI' }}>
      {renderMarkdown(insight.body)}
    </ArticleLayout>
  )
}
