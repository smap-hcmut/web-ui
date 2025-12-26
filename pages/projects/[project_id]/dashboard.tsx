import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import ProjectDetailLayout from '@/components/project/ProjectDetailLayout'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import DashboardGrid from '@/components/dashboard/DashboardGrid'
import MobileDashboard from '@/components/dashboard/MobileDashboard'
import ProjectSetupWizard from '@/components/dashboard/ProjectSetupWizard'
import ProjectProcessingState from '@/components/dashboard/ProjectProcessingState'
import { useDashboard, Project } from '@/contexts/DashboardContext'
import { useIsMobile } from '@/hooks/useResponsive'
import { projectService } from '@/lib/api/services/project.service'

const ProjectDashboardContent: React.FC<{ projectId: string }> = ({ projectId }) => {
  const router = useRouter()
  const { state, addProject, setProject } = useDashboard()
  const isMobile = useIsMobile()
  const [showWizard, setShowWizard] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [projectNotFound, setProjectNotFound] = useState(false)
  const loadedProjectRef = useRef<string | null>(null)

  // Memoize the load project function to prevent infinite loops
  const loadProject = useCallback(async () => {
    // Prevent loading the same project multiple times
    if (loadedProjectRef.current === projectId) {
      return
    }

    setIsLoading(true)
    setProjectNotFound(false)

    try {
      // First, check if project exists in context
      const contextProject = state.projects.find(p => p.id === projectId)
      
      if (contextProject) {
        setCurrentProject(contextProject)
        if (state.selectedProject !== projectId) {
          setProject(projectId)
        }
        loadedProjectRef.current = projectId
        setIsLoading(false)
        return
      }

      // If not in context, try to fetch from API
      try {
        // Try to get the project from the projects list API first
        const projectsResponse = await projectService.getProjects({
          page: 1,
          limit: 100 // Get a reasonable number to find our project
        })
        
        const foundProject = projectsResponse.projects.find(p => p.id === projectId)
        
        if (foundProject) {
          // Add to context and set as current
          addProject(foundProject)
          setCurrentProject(foundProject)
          setProject(projectId)
          loadedProjectRef.current = projectId
        } else {
          // Project not found
          setProjectNotFound(true)
          loadedProjectRef.current = projectId
        }
      } catch (apiError) {
        console.error('Failed to fetch project:', apiError)
        // If API fails, still show project not found
        setProjectNotFound(true)
        loadedProjectRef.current = projectId
      }
    } catch (error) {
      console.error('Error loading project:', error)
      setProjectNotFound(true)
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

  // Handle redirect for draft projects
  useEffect(() => {
    if (currentProject?.status === 'draft') {
      router.push('/projects')
    }
  }, [currentProject, router])

  const handleProjectComplete = (projectData: any) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: projectData.name,
      description: projectData.description,
      brands: projectData.brands,
      competitors: projectData.competitors,
      createdAt: new Date(),
      status: 'completed'
    }

    addProject(newProject)
    setShowWizard(false)
  }

  if (isLoading) {
    return (
      <ProjectDetailLayout projectId={projectId}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block w-16 h-16 border-4 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </ProjectDetailLayout>
    )
  }

  // Handle project not found
  if (projectNotFound || (!currentProject && !isLoading)) {
    return (
      <ProjectDetailLayout projectId={projectId}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Project Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">The project you&apos;re looking for doesn&apos;t exist.</p>
            <button
              onClick={() => router.push('/projects')}
              className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </ProjectDetailLayout>
    )
  }

  // Handle processing projects
  if (currentProject?.status === 'process') {
    return (
      <ProjectDetailLayout projectId={projectId}>
        <ProjectProcessingState projectId={currentProject.id} />
      </ProjectDetailLayout>
    )
  }

  // Handle draft projects - redirect is handled in useEffect above
  if (currentProject?.status === 'draft') {
    return null
  }

  if (isMobile) {
    return (
      <>
        <MobileDashboard />
        <ProjectSetupWizard
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          onComplete={handleProjectComplete}
        />
      </>
    )
  }

  return (
    <ProjectDetailLayout projectId={projectId}>
      <div className="flex h-full overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <DashboardGrid />
        </div>
      </div>

      <ProjectSetupWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={handleProjectComplete}
      />
    </ProjectDetailLayout>
  )
}

const ProjectDashboard: NextPage = () => {
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

  return <ProjectDashboardContent projectId={project_id} />
}

export async function getServerSideProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}

export default ProjectDashboard
