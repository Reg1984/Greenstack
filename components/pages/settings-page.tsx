'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { cn } from '@/lib/utils'
import { GsCard, GsBadge } from '@/components/greenstack-ui'
import { getAutoBidSettings, createOrUpdateAutoBidSettings } from '@/app/actions/database'
import { runAutoBidding } from '@/app/actions/ai'
import { CheckCircle2, AlertCircle } from 'lucide-react'

const CAPABILITY_OPTIONS = [
  'Solar PV Installation',
  'BEMS Systems',
  'Heat Pump Installation',
  'LED Retrofits',
  'Energy Audits',
  'Supply Chain Consulting',
  'Sustainability Strategy',
  'Carbon Accounting',
  'EPC Certification',
  'Mechanical Installation',
]

const SECTOR_OPTIONS = [
  'Energy',
  'Healthcare',
  'Education',
  'Local Authority',
  'Aviation',
  'Utilities',
  'Manufacturing',
  'Finance',
  'Retail',
  'Transportation',
]

export default function SettingsPage() {
  const { data: settings, mutate } = useSWR('auto-bid-settings', () => getAutoBidSettings(), { revalidateOnFocus: false })
  
  const [enabled, setEnabled] = useState(false)
  const [matchThreshold, setMatchThreshold] = useState(65)
  const [capabilities, setCapabilities] = useState<string[]>([])
  const [sectors, setSectors] = useState<string[]>([])
  const [maxBidValue, setMaxBidValue] = useState(500)
  const [notifyOnBid, setNotifyOnBid] = useState(true)
  const [autoSubmit, setAutoSubmit] = useState(true)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('')

  // Load settings on mount
  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled || false)
      setMatchThreshold(settings.match_threshold || 65)
      setCapabilities(settings.capabilities || [])
      setSectors(settings.sectors || [])
      setMaxBidValue(settings.max_bid_value || 500)
      setNotifyOnBid(settings.notify_on_bid !== false)
      setAutoSubmit(settings.auto_submit !== false)
    }
  }, [settings])

  const handleSaveSettings = async () => {
    setSaving(true)
    setMessage('')
    try {
      await createOrUpdateAutoBidSettings({
        enabled,
        match_threshold: matchThreshold,
        capabilities,
        sectors,
        max_bid_value: maxBidValue,
        notify_on_bid: notifyOnBid,
        auto_submit: autoSubmit,
      })
      mutate()
      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      setMessage('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleRunAutoBidding = async () => {
    setRunning(true)
    setMessage('')
    try {
      const result = await runAutoBidding({
        user_id: '', // Will be fetched from auth in the function
        match_threshold: matchThreshold,
        capabilities,
        max_bid_value: maxBidValue,
        sectors,
        notify_on_bid: notifyOnBid,
      })
      setMessage(`${result.results.length} bids submitted! Check the dashboard for details.`)
      setTimeout(() => setMessage(''), 5000)
    } catch (error) {
      console.error('Failed to run auto-bidding:', error)
      setMessage('Auto-bidding failed. Please check your settings and try again.')
    } finally {
      setRunning(false)
    }
  }

  const toggleCapability = (cap: string) => {
    setCapabilities(prev =>
      prev.includes(cap) ? prev.filter(c => c !== cap) : [...prev, cap]
    )
  }

  const toggleSector = (sec: string) => {
    setSectors(prev =>
      prev.includes(sec) ? prev.filter(s => s !== sec) : [...prev, sec]
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Auto-Bidding Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure AI auto-bidding preferences and capability matching</p>
      </div>

      {message && (
        <div className={cn(
          'p-4 rounded-xl border flex items-center gap-3',
          message.includes('success') || message.includes('submitted')
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        )}>
          {message.includes('success') || message.includes('submitted') ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm">{message}</span>
        </div>
      )}

      {/* Enable/Disable Toggle */}
      <GsCard className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Auto-Bidding Status</h2>
            <p className="text-sm text-slate-500 mt-1">Enable AI to automatically find and submit bids</p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={cn(
              'relative inline-flex h-8 w-14 items-center rounded-full transition-colors',
              enabled ? 'bg-emerald-500' : 'bg-slate-700'
            )}
          >
            <span
              className={cn(
                'inline-block h-6 w-6 transform rounded-full bg-white transition-transform',
                enabled ? 'translate-x-7' : 'translate-x-1'
              )}
            />
          </button>
        </div>
        {enabled && (
          <p className="text-xs text-emerald-400 mt-3 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Auto-bidding is active
          </p>
        )}
      </GsCard>

      {/* Match Threshold */}
      <GsCard className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Match Threshold</h3>
          <p className="text-sm text-slate-500">Only bid on tenders with at least this match score</p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              value={matchThreshold}
              onChange={(e) => setMatchThreshold(parseInt(e.target.value))}
              className="flex-1 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="w-16">
              <input
                type="number"
                min="0"
                max="100"
                value={matchThreshold}
                onChange={(e) => setMatchThreshold(parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-emerald-500/40"
              />
            </div>
            <span className="text-sm text-slate-400">%</span>
          </div>
          <p className="text-xs text-slate-500">
            {matchThreshold >= 80 ? 'Very strict - only top matches' : 
             matchThreshold >= 65 ? 'Balanced - good filter' :
             'Permissive - more opportunities'}
          </p>
        </div>
      </GsCard>

      {/* Company Capabilities */}
      <GsCard className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Company Capabilities</h3>
          <p className="text-sm text-slate-500">Select areas where your company excels</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {CAPABILITY_OPTIONS.map((cap) => (
            <button
              key={cap}
              onClick={() => toggleCapability(cap)}
              className={cn(
                'p-3 rounded-lg border text-sm font-medium transition-all text-left',
                capabilities.includes(cap)
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-4 h-4 rounded border transition-colors',
                    capabilities.includes(cap)
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-slate-500'
                  )}
                />
                {cap}
              </div>
            </button>
          ))}
        </div>
      </GsCard>

      {/* Target Sectors */}
      <GsCard className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Target Sectors</h3>
          <p className="text-sm text-slate-500">Industries where you want to pursue tenders</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SECTOR_OPTIONS.map((sec) => (
            <button
              key={sec}
              onClick={() => toggleSector(sec)}
              className={cn(
                'p-2.5 rounded-lg border text-sm font-medium transition-all',
                sectors.includes(sec)
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              )}
            >
              {sec}
            </button>
          ))}
        </div>
      </GsCard>

      {/* Bid Value Limit */}
      <GsCard className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Maximum Bid Value</h3>
          <p className="text-sm text-slate-500">Don't bid on contracts exceeding this value (in £1000s)</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">£</span>
          <input
            type="number"
            min="10"
            max="5000"
            step="50"
            value={maxBidValue}
            onChange={(e) => setMaxBidValue(parseInt(e.target.value))}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40"
          />
          <span className="text-sm text-slate-400">k</span>
        </div>
      </GsCard>

      {/* Notifications & Auto-Submit */}
      <GsCard className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Notify on bid submission</p>
            <p className="text-xs text-slate-500 mt-0.5">Get alerted when AI submits bids</p>
          </div>
          <button
            onClick={() => setNotifyOnBid(!notifyOnBid)}
            className={cn(
              'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
              notifyOnBid ? 'bg-emerald-500' : 'bg-slate-700'
            )}
          >
            <span
              className={cn(
                'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
                notifyOnBid ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        <div className="border-t border-white/5 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Auto-submit bids</p>
              <p className="text-xs text-slate-500 mt-0.5">Automatically submit when threshold is met</p>
            </div>
            <button
              onClick={() => setAutoSubmit(!autoSubmit)}
              className={cn(
                'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                autoSubmit ? 'bg-emerald-500' : 'bg-slate-700'
              )}
            >
              <span
                className={cn(
                  'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
                  autoSubmit ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </div>
      </GsCard>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex-1 px-6 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium hover:bg-emerald-500/30 transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        <button
          onClick={handleRunAutoBidding}
          disabled={running || !enabled}
          className="flex-1 px-6 py-3 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 font-medium hover:bg-cyan-500/30 transition-all disabled:opacity-50"
        >
          {running ? 'Running...' : 'Run Auto-Bidding Now'}
        </button>
      </div>

      {/* Info Box */}
      <GsCard className="p-4 bg-white/5 border-white/10">
        <p className="text-xs text-slate-400 leading-relaxed">
          <span className="font-semibold text-slate-300">How it works:</span> The AI analyzes new tenders against your capabilities and sector preferences. When a tender's match score exceeds your threshold, a complete bid is generated and submitted automatically. All activity is logged in the dashboard.
        </p>
      </GsCard>
    </div>
  )
}
