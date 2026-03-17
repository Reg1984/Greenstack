'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { cn } from '@/lib/utils'
import { GsCard, GsBadge, ProgressBar, PulseDot, AIChatWidget, StatCard } from '@/components/greenstack-ui'
import { getBids, updateBid, getTenders } from '@/app/actions/database'
import { generateBidContent } from '@/app/actions/ai'
import { fmt } from '@/lib/data'
import { CheckCircle2 } from 'lucide-react'

const sections: Array<'executiveSummary' | 'companyCapabilities' | 'projectApproach' | 'timeline' | 'commercialTerms' | 'riskMitigation'> = 
  ['executiveSummary', 'companyCapabilities', 'projectApproach', 'timeline', 'commercialTerms', 'riskMitigation']

const sectionLabels: Record<string, string> = {
  executiveSummary: 'Executive Summary',
  companyCapabilities: 'Company Capabilities',
  projectApproach: 'Project Approach',
  timeline: 'Timeline',
  commercialTerms: 'Commercial Terms',
  riskMitigation: 'Risk Mitigation',
}

export default function BidBuilderPage() {
  const { data: allBids = [], mutate: mutateBids } = useSWR('bids', () => getBids(), { revalidateOnFocus: false })
  const { data: allTenders = [] } = useSWR('tenders', () => getTenders(), { revalidateOnFocus: false })
  
  const [selected, setSelected] = useState<any>(null)
  const [section, setSection] = useState<typeof sections[number]>('executiveSummary')
  const [generating, setGenerating] = useState(false)
  const [content, setContent] = useState('')
  const [completedSections, setCompletedSections] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Set initial selected bid
  useEffect(() => {
    if (allBids.length > 0 && !selected) {
      const bid = allBids[0]
      const tender = allTenders.find(t => t.id === bid.tender_id)
      setSelected({ ...bid, tenderData: tender })
    }
  }, [allBids, allTenders, selected])

  const handleSelectBid = (bid: any) => {
    const tender = allTenders.find(t => t.id === bid.tender_id)
    setSelected({ ...bid, tenderData: tender })
    setContent(bid.content?.[section] || '')
    setCompletedSections(
      sections.filter(s => bid.content?.[s] && bid.content[s].length > 0)
    )
  }

  const generate = async () => {
    if (!selected) return
    setGenerating(true)
    try {
      const generatedContent = await generateBidContent(
        section,
        selected.tenderData?.title || selected.tender_title || 'Tender',
        selected.tenderData?.description || ''
      )
      setContent(generatedContent)
      
      if (!completedSections.includes(section)) {
        setCompletedSections([...completedSections, section])
      }

      // Update bid with new content
      const updatedContent = {
        ...selected.content,
        [section]: generatedContent,
      }
      await updateBid(selected.id, {
        content: updatedContent,
        progress: Math.round((completedSections.length + 1) / sections.length * 100),
      })
      
      setSelected({ ...selected, content: updatedContent })
      mutateBids()
    } catch (error) {
      console.error('Failed to generate content:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!selected) return
    try {
      const updatedContent = {
        ...selected.content,
        [section]: content,
      }
      await updateBid(selected.id, {
        content: updatedContent,
        progress: Math.round(Object.values(updatedContent).filter((c: any) => c && c.length > 0).length / sections.length * 100),
      })
      setSelected({ ...selected, content: updatedContent })
      mutateBids()
    } catch (error) {
      console.error('Failed to save draft:', error)
    }
  }

  const handleSubmitBid = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      await updateBid(selected.id, { status: 'submitted' })
      mutateBids()
      setSelected({ ...selected, status: 'submitted' })
    } catch (error) {
      console.error('Failed to submit bid:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-full bg-background">
      {/* Left - Bid List & Section Checklist */}
      <div className="w-64 border-r border-white/5 overflow-y-auto p-5 flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Your Bids</p>
          </div>
          <div className="space-y-2">
            {allBids.map((b) => (
              <button
                key={b.id}
                onClick={() => handleSelectBid(b)}
                className={cn(
                  'w-full p-3 rounded-lg text-left text-sm transition-all',
                  selected?.id === b.id
                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                    : 'bg-white/5 border border-white/5 hover:bg-white/10'
                )}
              >
                <p className="text-white text-sm font-medium truncate">{b.tender_title}</p>
                <p className="text-xs text-slate-500 mt-1">{fmt(b.value || 0)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <ProgressBar value={b.progress || 0} color="#00ff87" />
                  <span className="text-xs text-slate-500">{b.progress || 0}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-white/5 pt-4">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">Sections</p>
          <div className="space-y-2">
            {sections.map((s) => {
              const isComplete = completedSections.includes(s)
              const isCurrent = section === s
              return (
                <button
                  key={s}
                  onClick={() => {
                    setSection(s)
                    setContent(selected?.content?.[s] || '')
                  }}
                  className={cn(
                    'w-full p-3 rounded-lg text-left text-sm transition-all flex items-center gap-2',
                    isCurrent
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-white'
                      : 'bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10'
                  )}
                >
                  {isComplete && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  <span className="flex-1">{sectionLabels[s]}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Center - Content Editor */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">{sectionLabels[section]}</h2>
            <p className="text-sm text-slate-500">
              {selected?.tender_title} · {fmt(selected?.value || 0)}
            </p>
          </div>

          <GsCard className="p-6 mb-6">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="AI-generated content will appear here. Click 'Generate with AI' to start..."
              className="w-full h-80 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40 resize-none"
            />
          </GsCard>

          <div className="flex gap-3">
            <button
              onClick={generate}
              disabled={generating || !selected}
              className="px-4 py-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {generating ? (
                <>
                  <span className="animate-spin inline-block">{"⟳"}</span>Generating...
                </>
              ) : (
                <>Generate with AI</>
              )}
            </button>
            <button 
              onClick={handleSaveDraft}
              disabled={!selected}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-300 text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Save Draft
            </button>
          </div>
        </div>
      </div>

      {/* Right - AI Assistant */}
      <div className="w-80 border-l border-white/5 overflow-y-auto p-5 flex flex-col">
        <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">AI Assistant</h3>

        <GsCard className="p-4 bg-emerald-500/5 border-emerald-500/20 mb-4">
          <p className="text-xs text-slate-400 mb-3">
            {completedSections.length}/{sections.length} sections completed
          </p>
          <div className="space-y-1.5">
            {sections.map((s) => (
              <div key={s} className="flex items-center gap-2 text-xs">
                {completedSections.includes(s) ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                )}
                <span className="text-slate-400">{sectionLabels[s]}</span>
              </div>
            ))}
          </div>
        </GsCard>

        <div className="flex-1 mb-4">
          <AIChatWidget
            placeholder="How can I improve this?"
            systemPrompt={`You are GreenStack's bid optimization AI. Current bid: ${selected?.tender_title}, Value: ${fmt(selected?.value || 0)}, Section: ${sectionLabels[section]}.`}
          />
        </div>

        <GsCard className="p-4 bg-white/5 border-white/10">
          <p className="text-xs text-slate-500 mb-3">Quick Actions</p>
          <button 
            onClick={handleSaveDraft}
            disabled={!selected}
            className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-300 transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>
          <button 
            onClick={handleSubmitBid}
            disabled={!selected || submitting}
            className="w-full px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 transition-colors mt-2 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Bid'}
          </button>
        </GsCard>
      </div>
    </div>
  )
}
