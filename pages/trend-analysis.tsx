import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import TrendDashboard from '@/components/trend/TrendDashboard'
import TopicDetail from '@/components/trend/TopicDetail'
import TrendFilters from '@/components/trend/TrendFilters'
import SavedItems from '@/components/trend/SavedItems'
import { TrendProvider } from '@/contexts/TrendContext'
import { useIsMobile } from '@/hooks/useResponsive'

const TrendAnalysis: NextPage = () => {
  const { t } = useTranslation('common')
  const isMobile = useIsMobile()

  return (
    <TrendProvider>
      <div className="flex flex-col h-screen bg-background">
        <Navbar />

        <main className="flex-1 overflow-hidden">
          <TrendAnalysisContent />
        </main>

        <Footer />

        {}
        <SavedItems />
      </div>
    </TrendProvider>
  )
}

const TrendAnalysisContent: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="flex h-full">
      {}
      <div className="flex-1 flex flex-col overflow-hidden">
        {}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Trend Analysis
            </h1>
            <p className="text-muted-foreground mt-1">
              Khám phá xu hướng nội dung theo thời gian thực
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
          </div>
        </div>

        {}
        <div className="flex-1 overflow-hidden">
          {selectedTopic ? (
            <TopicDetail
              topicId={selectedTopic}
              onBack={() => setSelectedTopic(null)}
            />
          ) : (
            <TrendDashboard onTopicSelect={setSelectedTopic} />
          )}
        </div>
      </div>

      {}
      {showFilters && (
        <div className="w-80 border-l border-border bg-card/50">
          <TrendFilters onClose={() => setShowFilters(false)} />
        </div>
      )}
    </div>
  )
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}

export default TrendAnalysis
