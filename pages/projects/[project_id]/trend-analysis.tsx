import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import ProjectDetailLayout from '@/components/project/ProjectDetailLayout'
import TrendDashboard from '@/components/trend/TrendDashboard'
import TopicDetail from '@/components/trend/TopicDetail'
import TrendFilters from '@/components/trend/TrendFilters'
import SavedItems from '@/components/trend/SavedItems'
import { TrendProvider } from '@/contexts/TrendContext'
import { useDashboard } from '@/contexts/DashboardContext'
import { projectService } from '@/lib/api/services/project.service'
import { HelpCircle } from 'lucide-react'
import { useTrendTour } from '@/hooks/useTrendTour'

const ProjectTrendAnalysisContent: React.FC<{ projectId: string }> = ({ projectId }) => {
  const router = useRouter()
  const { state, setProject, addProject, dashboardPosts, loadingPosts } = useDashboard()
  const { startTour } = useTrendTour()
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const loadedProjectRef = useRef<string | null>(null)

  // Load project from API if not in context
  const loadProject = useCallback(async () => {
    if (loadedProjectRef.current === projectId) {
      return
    }

    setIsLoading(true)

    try {
      // Check if project exists in context
      const contextProject = state.projects.find(p => p.id === projectId)
      
      if (contextProject) {
        if (state.selectedProject !== projectId) {
          setProject(projectId)
        }
        loadedProjectRef.current = projectId
        setIsLoading(false)
        return
      }

      // If not in context, try to fetch from API
      try {
        const projectsResponse = await projectService.getProjects({
          page: 1,
          limit: 100
        })
        
        const foundProject = projectsResponse.projects.find(p => p.id === projectId)
        
        if (foundProject) {
          addProject(foundProject)
          setProject(projectId)
        } else {
          // Project not found in API, but still set it to trigger data fetch
          // The dashboard data hook will handle the actual data fetching
          setProject(projectId)
        }
        loadedProjectRef.current = projectId
      } catch (apiError) {
        console.error('Failed to fetch project:', apiError)
        // Still set project to trigger data fetch attempt
        setProject(projectId)
        loadedProjectRef.current = projectId
      }
    } catch (error) {
      console.error('Error loading project:', error)
      setProject(projectId)
      loadedProjectRef.current = projectId
    } finally {
      setIsLoading(false)
    }
  }, [projectId, state.projects, state.selectedProject, addProject, setProject])

  // Handle project loading
  useEffect(() => {
    if (projectId && loadedProjectRef.current !== projectId) {
      loadProject()
    }
  }, [projectId, loadProject])

  // Reset loaded project ref when projectId changes
  useEffect(() => {
    if (loadedProjectRef.current !== projectId) {
      loadedProjectRef.current = null
    }
  }, [projectId])

  // Handle redirect for draft projects (only for mock projects)
  useEffect(() => {
    const currentProject = state.projects.find(p => p.id === state.selectedProject)
    if (currentProject?.status === 'draft') {
      router.push('/projects')
    }
  }, [state.selectedProject, state.projects, router])

  // Show loading while data is being fetched
  // For API-based projects, we show loading until posts are loaded (or error occurs)
  const isDataLoading = isLoading || (state.selectedProject === projectId && loadingPosts && !dashboardPosts)
  
  if (isDataLoading) {
    return (
      <ProjectDetailLayout projectId={projectId}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block w-16 h-16 border-4 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading trend analysis...</p>
          </div>
        </div>
      </ProjectDetailLayout>
    )
  }

  // Note: We don't check for "Project Not Found" anymore because:
  // - API-based projects (UUID) won't be in the mock projects list
  // - The API will return data if the project exists
  // - If no data is returned, the TrendDashboard will show "No Data" state

  return (
    <ProjectDetailLayout projectId={projectId}>
      <div className="flex h-full overflow-hidden">
        {/* Main content area - scrollable */}
        <div className="flex-1 overflow-auto">
          {/* Header - sticky */}
          <div id="trend-header" className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-amber-300/60 dark:border-white/20 bg-amber-50/95 dark:bg-gray-950/95 backdrop-blur-sm">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Trend Analysis
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Khám phá xu hướng nội dung theo thời gian thực
                <button
                  onClick={startTour}
                  className="ml-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline inline-flex items-center gap-1"
                >
                  <HelpCircle className="h-3 w-3" />
                  Xem hướng dẫn
                </button>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="trend-filters-btn"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </button>
            </div>
          </div>

          {/* Content */}
          <div>
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

        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-80 border-l border-amber-300/60 dark:border-white/20 bg-white/40 dark:bg-gray-900/40 overflow-auto">
            <TrendFilters onClose={() => setShowFilters(false)} />
          </div>
        )}
      </div>

      {/* Saved Items Modal */}
      <SavedItems />
    </ProjectDetailLayout>
  )
}

const ProjectTrendAnalysis: NextPage = () => {
  const router = useRouter()
  const { project_id } = router.query

  if (!project_id || typeof project_id !== 'string') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-amber-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <TrendProvider>
      <ProjectTrendAnalysisContent projectId={project_id} />
    </TrendProvider>
  )
}

export async function getServerSideProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}

export default ProjectTrendAnalysis
