import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import {
  FileText,
  Download,
  BarChart3,
  TrendingUp,
  Eye,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Calendar,
  Hash,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  ExternalLink
} from 'lucide-react'
import ProjectDetailLayout from '@/components/project/ProjectDetailLayout'
import { useDashboard, Project } from '@/contexts/DashboardContext'
import { TrendProvider, useTrend, TrendTopic, TrendHashtag, TrendPost } from '@/contexts/TrendContext'
import { projectService } from '@/lib/api/services/project.service'

type ReportType = 'dashboard' | 'trend'

interface ReportConfig {
  type: ReportType
  title: string
  includeMetrics: boolean
  includeCharts: boolean
  includeTrends: boolean
  includeTopPosts: boolean
}

const ReportWizardContent: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const reportRef = useRef<HTMLDivElement>(null)
  
  const { state, setProject, addProject, dashboardPosts, loadingPosts } = useDashboard()
  const { state: trendState, filteredTopics, filteredHashtags, filteredPosts } = useTrend()
  
  const [step, setStep] = useState<'select' | 'preview'>('select')
  const [reportType, setReportType] = useState<ReportType>('dashboard')
  const [isExporting, setIsExporting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [config, setConfig] = useState<ReportConfig>({
    type: 'dashboard',
    title: 'Social Media Analytics Report',
    includeMetrics: true,
    includeCharts: true,
    includeTrends: true,
    includeTopPosts: true
  })

  // Load project
  useEffect(() => {
    const loadProject = async () => {
      setIsLoading(true)
      try {
        const contextProject = state.projects.find(p => p.id === projectId)
        if (contextProject) {
          if (state.selectedProject !== projectId) {
            setProject(projectId)
          }
        } else {
          const projectsResponse = await projectService.getProjects({ page: 1, limit: 100 })
          const foundProject = projectsResponse.projects.find(p => p.id === projectId)
          if (foundProject) {
            addProject(foundProject)
            setProject(projectId)
          }
        }
      } catch (error) {
        console.error('Error loading project:', error)
      } finally {
        setIsLoading(false)
      }
    }
    if (projectId) loadProject()
  }, [projectId])

  // Get dashboard data
  const dashboardData = state.dashboardData
  const currentProject = state.projects.find(p => p.id === state.selectedProject)

  const handleExportPDF = useCallback(async () => {
    if (!reportRef.current) return
    
    setIsExporting(true)
    try {
      // @ts-ignore - html2pdf.js doesn't have types
      const html2pdf = (await import('html2pdf.js')).default
      
      const element = reportRef.current
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${config.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      }
      
      await html2pdf().set(opt).from(element).save()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }, [config.title])

  if (isLoading || loadingPosts) {
    return (
      <ProjectDetailLayout projectId={projectId}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading report data...</p>
          </div>
        </div>
      </ProjectDetailLayout>
    )
  }

  return (
    <ProjectDetailLayout projectId={projectId}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {step === 'preview' && (
                <button
                  onClick={() => setStep('select')}
                  className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  Report Generator
                </h1>
                <p className="text-muted-foreground mt-1">
                  {currentProject?.name || 'Project'} - Export analytics to PDF
                </p>
              </div>
            </div>
            
            {step === 'preview' && (
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export PDF
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {step === 'select' ? (
            <SelectReportType
              reportType={reportType}
              setReportType={setReportType}
              config={config}
              setConfig={setConfig}
              onPreview={() => {
                setConfig(prev => ({ ...prev, type: reportType }))
                setStep('preview')
              }}
              hasDashboardData={!!dashboardData}
              hasTrendData={filteredTopics.length > 0}
            />
          ) : (
            <ReportPreview
              ref={reportRef}
              config={config}
              dashboardData={dashboardData}
              trendTopics={filteredTopics}
              trendHashtags={filteredHashtags}
              trendPosts={filteredPosts}
              projectName={currentProject?.name || 'Project'}
            />
          )}
        </div>
      </div>
    </ProjectDetailLayout>
  )
}

// Select Report Type Component
interface SelectReportTypeProps {
  reportType: ReportType
  setReportType: (type: ReportType) => void
  config: ReportConfig
  setConfig: (config: ReportConfig | ((prev: ReportConfig) => ReportConfig)) => void
  onPreview: () => void
  hasDashboardData: boolean
  hasTrendData: boolean
}

const SelectReportType: React.FC<SelectReportTypeProps> = ({
  reportType,
  setReportType,
  config,
  setConfig,
  onPreview,
  hasDashboardData,
  hasTrendData
}) => {
  const { t } = useTranslation('common')

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Report Type Selection */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Select Report Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setReportType('dashboard')}
            className={`p-6 rounded-xl border-2 text-left transition-all ${
              reportType === 'dashboard'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <BarChart3 className={`h-8 w-8 mb-3 ${reportType === 'dashboard' ? 'text-primary' : 'text-muted-foreground'}`} />
            <h3 className="font-semibold mb-1">Dashboard Report</h3>
            <p className="text-sm text-muted-foreground">
              Overview metrics, charts, and key performance indicators
            </p>
            {!hasDashboardData && (
              <p className="text-xs text-amber-500 mt-2">No dashboard data available</p>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setReportType('trend')}
            className={`p-6 rounded-xl border-2 text-left transition-all ${
              reportType === 'trend'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <TrendingUp className={`h-8 w-8 mb-3 ${reportType === 'trend' ? 'text-primary' : 'text-muted-foreground'}`} />
            <h3 className="font-semibold mb-1">Trend Analysis Report</h3>
            <p className="text-sm text-muted-foreground">
              Topics, hashtags, and trending content analysis
            </p>
            {!hasTrendData && (
              <p className="text-xs text-amber-500 mt-2">No trend data available</p>
            )}
          </motion.button>
        </div>
      </div>

      {/* Report Options */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Report Options</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeMetrics}
              onChange={(e) => setConfig(prev => ({ ...prev, includeMetrics: e.target.checked }))}
              className="w-4 h-4 rounded"
            />
            <span>Include Metrics Summary</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeCharts}
              onChange={(e) => setConfig(prev => ({ ...prev, includeCharts: e.target.checked }))}
              className="w-4 h-4 rounded"
            />
            <span>Include Charts & Visualizations</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeTopPosts}
              onChange={(e) => setConfig(prev => ({ ...prev, includeTopPosts: e.target.checked }))}
              className="w-4 h-4 rounded"
            />
            <span>Include Top Posts</span>
          </label>
        </div>
      </div>

      {/* Report Title */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Report Title</h2>
        <input
          type="text"
          value={config.title}
          onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Enter report title..."
        />
      </div>

      {/* Preview Button */}
      <div className="flex justify-end">
        <button
          onClick={onPreview}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Eye className="h-4 w-4" />
          Preview Report
        </button>
      </div>
    </div>
  )
}

// Report Preview Component
interface ReportPreviewProps {
  config: ReportConfig
  dashboardData: any
  trendTopics: TrendTopic[]
  trendHashtags: TrendHashtag[]
  trendPosts: TrendPost[]
  projectName: string
}

const ReportPreview = React.forwardRef<HTMLDivElement, ReportPreviewProps>(
  ({ config, dashboardData, trendTopics, trendHashtags, trendPosts, projectName }, ref) => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return (
      <div ref={ref} className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
        {/* Report Header */}
        <div className="bg-gradient-to-r from-blue-600 to-violet-600 text-white p-8">
          <h1 className="text-3xl font-bold mb-2">{config.title}</h1>
          <p className="opacity-90">{projectName}</p>
          <div className="flex items-center gap-2 mt-4 text-sm opacity-80">
            <Calendar className="h-4 w-4" />
            <span>Generated on {currentDate}</span>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Metrics Section */}
          {config.includeMetrics && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Key Metrics
              </h2>
              {config.type === 'dashboard' && dashboardData ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricBox label="Total Posts" value={dashboardData.totalPosts || 0} />
                  <MetricBox label="Total Engagement" value={dashboardData.totalEngagement || 0} />
                  <MetricBox label="Avg. Sentiment" value={`${((dashboardData.avgSentiment || 0) * 100).toFixed(1)}%`} />
                  <MetricBox label="Reach" value={dashboardData.totalReach || 0} />
                </div>
              ) : config.type === 'trend' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricBox label="Topics" value={trendTopics.length} />
                  <MetricBox label="Hashtags" value={trendHashtags.length} />
                  <MetricBox label="Posts Analyzed" value={trendPosts.length} />
                  <MetricBox label="Avg. Engagement" value={
                    trendPosts.length > 0 
                      ? Math.round(trendPosts.reduce((sum, p) => sum + (p.metrics?.likes || 0) + (p.metrics?.shares || 0) + (p.metrics?.comments || 0), 0) / trendPosts.length)
                      : 0
                  } />
                </div>
              ) : (
                <p className="text-muted-foreground">No metrics data available</p>
              )}
            </section>
          )}

          {/* Top Topics/Hashtags for Trend Report */}
          {config.type === 'trend' && config.includeCharts && (
            <>
              <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Hash className="h-5 w-5 text-primary" />
                  Top Topics
                </h2>
                {trendTopics.length > 0 ? (
                  <div className="space-y-2">
                    {trendTopics.slice(0, 10).map((topic, index) => (
                      <div key={topic.id} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>
                          <span className="font-medium">{topic.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{topic.volume} mentions</span>
                          <SentimentBadge sentiment={topic.sentiment.positive > topic.sentiment.negative ? 'positive' : topic.sentiment.negative > topic.sentiment.positive ? 'negative' : 'neutral'} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No topics data available</p>
                )}
              </section>

              <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Hash className="h-5 w-5 text-primary" />
                  Top Hashtags
                </h2>
                {trendHashtags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {trendHashtags.slice(0, 20).map((hashtag) => (
                      <span
                        key={hashtag.id}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                      >
                        #{hashtag.hashtag} ({hashtag.volume})
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hashtags data available</p>
                )}
              </section>
            </>
          )}

          {/* Top Posts */}
          {config.includeTopPosts && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Top Posts
              </h2>
              {trendPosts.length > 0 ? (
                <div className="space-y-4">
                  {trendPosts.slice(0, 5).map((post) => (
                    <div key={post.id} className="p-4 border border-border rounded-lg">
                      <p className="text-sm mb-3 line-clamp-3">{post.content}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>Platform: {post.platform}</span>
                          <span>Engagement: {(post.metrics?.likes || 0) + (post.metrics?.shares || 0) + (post.metrics?.comments || 0)}</span>
                        </div>
                        <SentimentBadge sentiment={post.sentiment.label} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No posts data available</p>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 text-center text-sm text-muted-foreground">
          <p>Generated by SMAP Analytics Platform</p>
        </div>
      </div>
    )
  }
)

ReportPreview.displayName = 'ReportPreview'

// Helper Components
const MetricBox: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="p-4 bg-accent/30 rounded-lg text-center">
    <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
)

const SentimentBadge: React.FC<{ sentiment: string }> = ({ sentiment }) => {
  const config = {
    positive: { icon: ThumbsUp, color: 'text-green-500', bg: 'bg-green-500/10' },
    negative: { icon: ThumbsDown, color: 'text-red-500', bg: 'bg-red-500/10' },
    neutral: { icon: Minus, color: 'text-gray-500', bg: 'bg-gray-500/10' }
  }
  const { icon: Icon, color, bg } = config[sentiment as keyof typeof config] || config.neutral
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${color} ${bg}`}>
      <Icon className="h-3 w-3" />
      {sentiment}
    </span>
  )
}

// Main Page Component
const ReportWizardPage: NextPage = () => {
  const router = useRouter()
  const { project_id } = router.query

  if (!project_id || typeof project_id !== 'string') {
    return null
  }

  return (
    <TrendProvider>
      <ReportWizardContent projectId={project_id} />
    </TrendProvider>
  )
}

export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
})

export default ReportWizardPage
