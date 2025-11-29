import type { NextPage } from 'next'
import { useState, useEffect } from 'react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/router'
import {
  Plus,
  Search,
  FolderOpen,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Users,
  Target,
  AlertCircle,
} from 'lucide-react'
import { Project, useDashboard } from '@/contexts/DashboardContext'
import ProjectSetupWizard from '@/components/dashboard/ProjectSetupWizard'
import { projectService } from '@/lib/api/services/project.service'
import Swal from 'sweetalert2'

// Hardcoded projects data - temporary until API is ready
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'VinFast Automotive',
    description: 'Monitor VinFast brand performance and compare with automotive competitors',
    brands: [
      {
        id: 'b1',
        name: 'VinFast',
        type: 'own',
        keywords: ['vinfast', 'vf8', 'vf9', 'xe điện vinfast'],
        urls: ['https://vinfastauto.com'],
      },
    ],
    competitors: [
      {
        id: 'c1',
        name: 'Tesla',
        type: 'competitor',
        keywords: ['tesla', 'model 3', 'model y'],
        urls: ['https://tesla.com'],
      },
      {
        id: 'c2',
        name: 'Hyundai',
        type: 'competitor',
        keywords: ['hyundai', 'tucson', 'santa fe'],
        urls: ['https://hyundai.com'],
      },
    ],
    createdAt: new Date('2024-01-15'),
    status: 'active',
  },
  {
    id: '2',
    name: 'Momo E-Wallet',
    description: 'Social media sentiment analysis for Momo payment platform',
    brands: [
      {
        id: 'b2',
        name: 'Momo',
        type: 'own',
        keywords: ['momo', 'ví momo', 'thanh toán momo'],
        urls: ['https://momo.vn'],
      },
    ],
    competitors: [
      {
        id: 'c3',
        name: 'ZaloPay',
        type: 'competitor',
        keywords: ['zalopay', 'ví zalopay'],
        urls: ['https://zalopay.vn'],
      },
      {
        id: 'c4',
        name: 'VNPay',
        type: 'competitor',
        keywords: ['vnpay', 'ví vnpay'],
        urls: ['https://vnpay.vn'],
      },
      {
        id: 'c5',
        name: 'ShopeePay',
        type: 'competitor',
        keywords: ['shopeepay', 'ví shopee'],
        urls: ['https://shopee.vn'],
      },
    ],
    createdAt: new Date('2024-02-20'),
    status: 'active',
  },
  {
    id: '3',
    name: 'The Coffee House',
    description: 'Track customer feedback and competitor analysis in F&B sector',
    brands: [
      {
        id: 'b3',
        name: 'The Coffee House',
        type: 'own',
        keywords: ['the coffee house', 'tch', 'cà phê nhà'],
        urls: ['https://thecoffeehouse.com'],
      },
    ],
    competitors: [
      {
        id: 'c6',
        name: 'Highlands Coffee',
        type: 'competitor',
        keywords: ['highlands', 'highlands coffee'],
        urls: ['https://highlandscoffee.com.vn'],
      },
      {
        id: 'c7',
        name: 'Starbucks',
        type: 'competitor',
        keywords: ['starbucks', 'starbucks vietnam'],
        urls: ['https://starbucks.vn'],
      },
    ],
    createdAt: new Date('2024-03-10'),
    status: 'processing',
  },
]

const ProjectsContent: React.FC = () => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { state, addProject: addProjectToContext, setProject } = useDashboard()

  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  // Fetch projects from API on mount
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await projectService.getProjects()
        setProjects(data)

        // Sync to context if needed
        data.forEach(project => addProjectToContext(project))
      } catch (err: any) {
        console.error('Failed to fetch projects:', err)
        setError(err?.message || t('projects.fetchError'))

        // Fallback to mock data on error
        setProjects(mockProjects)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [])

  // Filter projects by search query
  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateProject = async (projectData: any) => {
    try {
      // Simulate API call
      const newProject: Project = {
        id: `project_${Date.now()}`,
        name: projectData.name,
        description: projectData.description,
        brands: projectData.brands.map((b: any, idx: number) => ({
          ...b,
          id: `b${Date.now()}-${idx}`,
        })),
        competitors: projectData.competitors.map((c: any, idx: number) => ({
          ...c,
          id: `c${Date.now()}-${idx}`,
        })),
        createdAt: new Date(),
        status: 'active' as const,
      }

      // Add to context
      addProjectToContext(newProject)
      setProjects([...projects, newProject])
      setIsWizardOpen(false)
    } catch (err) {
      console.error('Create project error:', err)
    }
  }

  const handleDeleteProject = async (id: string) => {
    const project = projects.find((p) => p.id === id)
    if (!project) return

    const result = await Swal.fire({
      title: t('projects.deleteConfirm.title'),
      html: `${t('projects.deleteConfirm.text')}<br><strong>${project.name}</strong>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t('projects.deleteConfirm.confirm'),
      cancelButtonText: t('projects.deleteConfirm.cancel'),
      background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
      color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000',
    })

    if (!result.isConfirmed) return

    try {
      // Simulate API call
      setProjects(projects.filter((p) => p.id !== id))
      setSelectedProjectId(null)

      // Success notification
      await Swal.fire({
        title: t('projects.deleteConfirm.success'),
        text: t('projects.deleteConfirm.successText'),
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000',
      })
    } catch (err) {
      console.error('Delete project error:', err)

      // Error notification
      await Swal.fire({
        title: t('projects.deleteConfirm.error'),
        text: t('projects.deleteConfirm.errorText'),
        icon: 'error',
        confirmButtonColor: '#dc2626',
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000',
      })
    }
  }

  const handleViewProject = (id: string) => {
    // Set project in context before navigating
    setProject(id)
    // Navigate to dashboard with project ID
    router.push(`/dashboard?project=${id}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300'
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300'
    }
  }

  return (
    <div className="min-h-screen relative bg-amber-50 dark:bg-gray-950 overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Sun Mode - Warm Glows */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-yellow-100/60 rounded-full blur-[128px] dark:hidden" />
        <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] bg-amber-100/50 rounded-full blur-[128px] dark:hidden" />

        {/* Dark Mode - Night Sky Stars */}
        <div
          className="hidden dark:block absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(2px 2px at 20% 30%, white, transparent),
              radial-gradient(2px 2px at 60% 70%, white, transparent),
              radial-gradient(1px 1px at 50% 50%, white, transparent),
              radial-gradient(1px 1px at 80% 10%, white, transparent),
              radial-gradient(2px 2px at 90% 60%, white, transparent),
              radial-gradient(1px 1px at 33% 80%, white, transparent),
              radial-gradient(1px 1px at 15% 60%, white, transparent)
            `,
            backgroundSize: '200px 200px, 250px 250px, 150px 150px, 180px 180px, 220px 220px, 300px 300px, 280px 280px',
            backgroundPosition: '0 0, 40px 60px, 130px 270px, 70px 100px, 150px 50px, 250px 150px, 100px 200px',
            opacity: 0.4,
          }}
        />
        <div className="hidden dark:block absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-[128px]" />
        <div className="hidden dark:block absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
                  {t('projects.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('projects.subtitle')}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsWizardOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                {t('projects.createNew')}
              </motion.button>
            </div>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('projects.searchPlaceholder')}
                className="w-full pl-12 pr-4 py-3 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-amber-300/60 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white"
              />
            </div>
          </motion.div>

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-4 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">
                  {t('projects.error')}
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-amber-300/60 dark:border-white/20 rounded-2xl p-6 animate-pulse"
                >
                  <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredProjects.length === 0 && !error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-16"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
                <FolderOpen className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                {searchQuery ? t('projects.noResults') : t('projects.noProjects')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery
                  ? t('projects.noResultsDescription')
                  : t('projects.noProjectsDescription')}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsWizardOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  {t('projects.createFirst')}
                </button>
              )}
            </motion.div>
          )}

          {/* Projects Grid */}
          {!isLoading && filteredProjects.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {filteredProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ y: -5 }}
                    className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-amber-300/60 dark:border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                    onClick={() => handleViewProject(project.id)}
                  >
                    {/* Project Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-yellow-400 dark:bg-white rounded-xl flex items-center justify-center">
                          <FolderOpen className="w-6 h-6 text-gray-900" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                            {project.name}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusColor(
                              project.status
                            )}`}
                          >
                            {t(`projects.status.${project.status}`)}
                          </span>
                        </div>
                      </div>

                      {/* Actions Menu */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedProjectId(
                            selectedProjectId === project.id ? null : project.id
                          )
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>

                      {/* Actions Dropdown */}
                      <AnimatePresence>
                        {selectedProjectId === project.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-6 mt-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-10 overflow-hidden"
                          >
                            <button
                              onClick={() => handleViewProject(project.id)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                            >
                              <Eye className="w-4 h-4" />
                              {t('projects.actions.view')}
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project.id)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
                            >
                              <Trash2 className="w-4 h-4" />
                              {t('projects.actions.delete')}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Project Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {project.description || t('projects.noDescription')}
                    </p>

                    {/* Project Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                          <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {t('projects.brands')}
                          </p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {project.brands.length}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                          <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {t('projects.competitors')}
                          </p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {project.competitors.length}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Created Date */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {t('projects.created')}{' '}
                        {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Project Setup Wizard */}
      <ProjectSetupWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={handleCreateProject}
      />
    </div>
  )
}

const Projects: NextPage = () => {
  return (
    <ProjectsContent />
  )
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}

export default Projects
