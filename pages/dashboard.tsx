import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import DashboardGrid from '../components/dashboard/DashboardGrid'
import MobileDashboard from '@/components/dashboard/MobileDashboard'
import EmptyState from '@/components/dashboard/EmptyState'
import ProjectSetupWizard from '@/components/dashboard/ProjectSetupWizard'
import ProjectProcessingState from '@/components/dashboard/ProjectProcessingState'
import ProjectSuccessState from '@/components/dashboard/ProjectSuccessState'
import { useDashboard, Project } from '@/contexts/DashboardContext'
import { useIsMobile } from '@/hooks/useResponsive'

const DashboardContent: React.FC = () => {
  const router = useRouter()
  const { state, addProject, setProject } = useDashboard()
  const isMobile = useIsMobile()
  const [showWizard, setShowWizard] = useState(false)

  // Handle project selection from URL query parameter
  useEffect(() => {
    const projectId = router.query.project as string
    if (projectId && projectId !== state.selectedProject) {
      // Check if project exists in the projects list
      const projectExists = state.projects.some(p => p.id === projectId)
      if (projectExists) {
        setProject(projectId)
      }
    }
  }, [router.query.project, state.selectedProject, state.projects, setProject])

  const handleCreateProject = () => {
    setShowWizard(true)
  }

  const handleImportProject = () => {

    console.log('Import project from CSV')
  }

  const handleProjectComplete = (projectData: any) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: projectData.name,
      description: projectData.description,
      brands: projectData.brands,
      competitors: projectData.competitors,
      createdAt: new Date(),
      status: 'active'
    }

    addProject(newProject)
    setShowWizard(false)
  }

  if (state.showEmptyState || state.projects.length === 0 || state.selectedProject === null) {
    return (
      <>
        <Navbar />
        <EmptyState
          onCreateProject={handleCreateProject}
          onImportProject={handleImportProject}
        />
        <Footer />

        <ProjectSetupWizard
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          onComplete={handleProjectComplete}
        />
      </>
    )
  }

  const currentProject = state.projects.find(p => p.id === state.selectedProject)

  if (currentProject?.status === 'processing') {
    return (
      <>
        <Navbar />
        <ProjectProcessingState />
        <Footer />
      </>
    )
  }

  if (currentProject?.status === 'active' && currentProject.createdAt &&
      (Date.now() - currentProject.createdAt.getTime()) < 10000) {
    return (
      <>
        <Navbar />
        <ProjectSuccessState />
        <Footer />
      </>
    )
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
    <>
      <div className="flex flex-col h-screen bg-background">
        <Navbar />

        <div className="flex flex-1 overflow-hidden">
          {}
          <DashboardSidebar />

          {}
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardHeader />

            <main className="flex-1 overflow-auto">
              <DashboardGrid />
            </main>
          </div>
        </div>

        <Footer />
      </div>

      <ProjectSetupWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={handleProjectComplete}
      />
    </>
  )
}

const Dashboard: NextPage = () => {
  const { t } = useTranslation('common')

  return <DashboardContent />
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}

export default Dashboard
