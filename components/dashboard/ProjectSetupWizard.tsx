import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Swal from 'sweetalert2'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/router'
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  Check,
  AlertCircle,
  Target,
  Users,
  Sparkles,
  Calendar
} from 'lucide-react'
import { projectService } from '@/lib/api/services/project.service'
import ProjectPreviewStep from './ProjectPreviewStep'
import { DryRunOuterPayload } from '@/lib/types/dryrun'
import { useJobWebSocket } from '@/hooks/useJobWebSocket'
import type { JobNotificationMessage, ContentItem } from '@/lib/types/websocket'

interface ProjectSetupWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (projectData: ProjectData) => void
}

interface ProjectData {
  name: string
  description: string
  brands: Brand[]
  competitors: Brand[]
  fromDate: string
  toDate: string
}

interface Brand {
  id: string
  name: string
  type: 'own' | 'competitor'
  keywords: string[]
  urls: string[]
}

const steps = [
  { id: 1, title: 'Thông tin cơ bản', description: 'Đặt tên và mô tả project' },
  { id: 2, title: 'Thương hiệu của bạn', description: 'Thêm thương hiệu cần theo dõi' },
  { id: 3, title: 'Đối thủ cạnh tranh', description: 'Thêm các đối thủ để so sánh' },
  { id: 4, title: 'Xem trước dữ liệu', description: 'Kiểm tra mẫu dữ liệu thu thập được' },
  { id: 5, title: 'Xác nhận', description: 'Kiểm tra và tạo project' }
]

export default function ProjectSetupWizard({ isOpen, onClose, onComplete }: ProjectSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const { theme } = useTheme()
  const router = useRouter()

  // Get today's date in YYYY-MM-DD format for input max attribute
  const today = new Date().toISOString().split('T')[0]

  // Helper function to get theme-aware Swal options
  const getSwalThemeOptions = () => ({
    background: theme === 'dark' ? '#1f2937' : '#ffffff',
    color: theme === 'dark' ? '#ffffff' : '#000000',
  })

  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    description: '',
    brands: [],
    competitors: [],
    fromDate: '',
    toDate: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Store raw keyword input to preserve commas while typing
  const [keywordInputs, setKeywordInputs] = useState<Record<string, string>>({})

  // Dry-run preview state
  const [dryRunData, setDryRunData] = useState<DryRunOuterPayload | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [dryRunJobId, setDryRunJobId] = useState<string | null>(null)

  // Job WebSocket for real-time dry-run results
  const {
    isConnected: isJobConnected,
    status: jobStatus,
    contentList,
    totalContentCount,
    connect: connectToJob,
    disconnect: disconnectFromJob,
  } = useJobWebSocket({
    onMessage: (message: JobNotificationMessage) => {
      console.log('Received job notification:', message)
    },
    onBatch: (batch) => {
      console.log('Received batch data:', batch.keyword, batch.content_list.length)
      // Convert new format to legacy format for compatibility
      if (batch.content_list.length > 0) {
        const legacyData: DryRunOuterPayload = {
          type: 'dryrun_result',
          job_id: dryRunJobId || '',
          platform: 'tiktok', // Default platform for now
          status: 'success',
          payload: {
            content: convertContentItemsToDryRunContent(batch.content_list),
            errors: []
          }
        }
        setDryRunData(legacyData)
        setIsLoadingPreview(false)
        setPreviewError(null)
      }
    },
    onCompleted: () => {
      console.log('Job completed')
      setIsLoadingPreview(false)
      if (contentList.length === 0) {
        setPreviewError('Không tìm thấy dữ liệu cho các từ khóa đã chọn')
      }
    },
    onFailed: (errors) => {
      console.log('Job failed:', errors)
      setIsLoadingPreview(false)
      setPreviewError(errors?.join(', ') || 'Job processing failed')
    },
    onError: (error) => {
      console.error('WebSocket error:', error)
      setPreviewError(`WebSocket error: ${error.message}`)
      setIsLoadingPreview(false)
    }
  })

  // Helper function to convert new ContentItem format to legacy DryRunContent format
  const convertContentItemsToDryRunContent = (items: ContentItem[]): any[] => {
    return items.map(item => ({
      meta: {
        id: item.id,
        platform: 'tiktok', // Default platform
        job_id: dryRunJobId || '',
        crawled_at: new Date().toISOString(),
        published_at: item.published_at,
        permalink: item.permalink,
        keyword_source: 'unknown',
        lang: 'vi',
        region: 'VN',
        pipeline_version: 'v1',
        fetch_status: 'success',
        fetch_error: null
      },
      content: {
        text: item.text,
        duration: item.media?.duration,
        hashtags: [],
        sound_name: null,
        category: null,
        title: null,
        media: item.media ? {
          type: item.media.type,
          video_path: item.media.url,
          audio_path: null,
          downloaded_at: new Date().toISOString()
        } : null,
        transcription: null
      },
      interaction: {
        views: item.metrics.views,
        likes: item.metrics.likes,
        comments_count: item.metrics.comments,
        shares: item.metrics.shares,
        saves: 0,
        engagement_rate: item.metrics.rate / 100,
        updated_at: new Date().toISOString()
      },
      author: {
        id: item.author.id,
        name: item.author.name,
        username: item.author.username,
        followers: item.author.followers,
        following: 0,
        likes: 0,
        videos: 0,
        is_verified: item.author.is_verified,
        bio: '',
        avatar_url: item.author.avatar_url,
        profile_url: `https://tiktok.com/@${item.author.username}`,
        country: null,
        total_view_count: null
      },
      comments: []
    }))
  }

  // Connect to job WebSocket when job ID is available
  useEffect(() => {
    if (dryRunJobId && !isJobConnected) {
      console.log('Connecting to job WebSocket:', dryRunJobId)
      connectToJob(dryRunJobId)
    }
  }, [dryRunJobId, isJobConnected, connectToJob])

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      disconnectFromJob()
    }
  }, [disconnectFromJob])

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!projectData.name.trim()) {
          newErrors.name = 'Tên project là bắt buộc'
        }
        if (!projectData.fromDate) {
          newErrors.fromDate = 'Ngày bắt đầu là bắt buộc'
        }
        if (!projectData.toDate) {
          newErrors.toDate = 'Ngày kết thúc là bắt buộc'
        }
        if (projectData.fromDate && projectData.toDate) {
          if (new Date(projectData.fromDate) > new Date(projectData.toDate)) {
            newErrors.toDate = 'Ngày kết thúc phải sau ngày bắt đầu'
          }
        }
        // Check if dates are not in the future
        if (projectData.fromDate && new Date(projectData.fromDate) > new Date(today)) {
          newErrors.fromDate = 'Ngày bắt đầu không được vượt quá ngày hiện tại'
        }
        if (projectData.toDate && new Date(projectData.toDate) > new Date(today)) {
          newErrors.toDate = 'Ngày kết thúc không được vượt quá ngày hiện tại'
        }
        break
      case 2:
        if (projectData.brands.length === 0) {
          newErrors.brands = 'Cần ít nhất một thương hiệu'
        }
        // Validate each brand
        projectData.brands.forEach((brand, index) => {
          if (!brand.name.trim()) {
            newErrors[`brand_name_${index}`] = 'Tên thương hiệu không được để trống'
          }
          if (brand.keywords.length === 0) {
            newErrors[`brand_keywords_${index}`] = 'Cần ít nhất một từ khóa'
          }
        })
        break
      case 3:
        if (projectData.competitors.length === 0) {
          newErrors.competitors = 'Cần ít nhất một đối thủ để so sánh'
        }
        // Validate each competitor
        projectData.competitors.forEach((competitor, index) => {
          if (!competitor.name.trim()) {
            newErrors[`competitor_name_${index}`] = 'Tên đối thủ không được để trống'
          }
          if (competitor.keywords.length === 0) {
            newErrors[`competitor_keywords_${index}`] = 'Cần ít nhất một từ khóa'
          }
        })
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      // No longer auto-trigger dry-run when moving from step 3 to 4
      // User will trigger it manually via button in preview step
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const triggerDryRun = async () => {
    setIsLoadingPreview(true)
    setPreviewError(null)
    setDryRunData(null)

    try {
      // Collect all keywords from brands and competitors
      const keywords = [
        ...projectData.brands.flatMap(b => b.keywords),
        ...projectData.competitors.flatMap(c => c.keywords)
      ]

      console.log('Triggering dry-run with keywords:', keywords)

      // Call dry-run API
      const response = await projectService.createDryRun(keywords)
      setDryRunJobId(response.job_id)

      console.log('Dry-run job created:', response.job_id)

      // Update URL to include job parameter for WebSocket connection
      const currentUrl = new URL(window.location.href)
      currentUrl.searchParams.set('job', response.job_id)
      router.replace(currentUrl.pathname + currentUrl.search, undefined, { shallow: true })

      // Set timeout for 60 seconds (increased from 30)
      setTimeout(() => {
        if (!dryRunData) {
          setIsLoadingPreview(false)
          setPreviewError('Timeout: Không nhận được dữ liệu preview sau 60 giây')
        }
      }, 60000)

    } catch (error: any) {
      console.error('Dry-run trigger error:', error)

      // Format error message
      let errorMessage = 'Không thể khởi chạy preview'
      if (error.message) {
        errorMessage = error.message
      }
      if (error.error_code) {
        errorMessage = `[Error ${error.error_code}] ${error.message || 'Something went wrong'}`
      }

      setPreviewError(errorMessage)
      setIsLoadingPreview(false)
    }
  }

  const handleRetryPreview = () => {
    triggerDryRun()
  }

  const handleTriggerRealPreview = () => {
    triggerDryRun()
  }

  const handleComplete = async () => {
    if (!validateStep(currentStep)) return

    // Step 1: Show confirmation modal
    const result = await Swal.fire({
      title: 'Xác nhận tạo project',
      html: `
        <p>Bạn có chắc chắn muốn tạo project <strong>${projectData.name}</strong>?</p>
        <p class="text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-2">
          Project sẽ được tạo và khởi chạy ngay lập tức.
        </p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      ...getSwalThemeOptions(),
    })

    // User cancelled - return early without API calls
    if (!result.isConfirmed) {
      return
    }

    // Step 2: Show loading modal after user confirms
    Swal.fire({
      title: 'Đang tạo project...',
      html: 'Vui lòng đợi trong giây lát',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      ...getSwalThemeOptions(),
      didOpen: () => {
        Swal.showLoading()
      },
    })

    setIsLoading(true)
    try {
      // Step 3: Call createProject API with project data
      const createdProject = await projectService.createProject({
        name: projectData.name,
        description: projectData.description,
        brands: projectData.brands,
        competitors: projectData.competitors,
        fromDate: projectData.fromDate,
        toDate: projectData.toDate,
      })

      // Step 4: Extract project ID from response
      if (!createdProject.id) {
        throw new Error('Project ID not returned from API')
      }

      // Step 5: Call executeProject API with extracted ID
      // Execute only runs if create succeeds
      await projectService.executeProject(createdProject.id)

      // Step 6: Show success modal after both APIs succeed
      await Swal.fire({
        title: 'Thành công!',
        html: 'Project đã được tạo và khởi chạy thành công',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#10b981',
        ...getSwalThemeOptions(),
      })

      // Step 7: Call onComplete() and onClose() after user clicks OK
      onComplete(projectData)
      onClose()
    } catch (error: any) {
      // Extract error message from API response or use fallback
      let errorMessage = 'Có lỗi xảy ra khi tạo project'
      let errorDetails = ''

      // Handle different error types
      if (error.message) {
        // Network errors or custom errors
        if (error.message.includes('Network error')) {
          errorMessage = 'Lỗi kết nối mạng'
          errorDetails = 'Vui lòng kiểm tra kết nối internet của bạn và thử lại.'
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Yêu cầu hết thời gian chờ'
          errorDetails = 'Máy chủ không phản hồi. Vui lòng thử lại sau.'
        } else {
          errorMessage = error.message
        }
      }

      // Handle API response errors with status codes
      if (error.status) {
        if (error.status >= 400 && error.status < 500) {
          // Client errors (validation, bad request, etc.)
          errorMessage = error.message || 'Dữ liệu không hợp lệ'
          if (error.status === 400) {
            errorDetails = 'Vui lòng kiểm tra lại thông tin và thử lại.'
          } else if (error.status === 401) {
            errorMessage = 'Phiên đăng nhập đã hết hạn'
            errorDetails = 'Vui lòng đăng nhập lại.'
          } else if (error.status === 403) {
            errorMessage = 'Bạn không có quyền thực hiện thao tác này'
          } else if (error.status === 404) {
            errorMessage = 'Không tìm thấy tài nguyên'
          } else if (error.status === 409) {
            errorMessage = 'Project đã tồn tại'
            errorDetails = 'Vui lòng sử dụng tên khác.'
          }
        } else if (error.status >= 500) {
          // Server errors
          errorMessage = 'Lỗi máy chủ'
          errorDetails = 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
        }
      }

      // Show error modal with appropriate message
      await Swal.fire({
        title: 'Lỗi!',
        html: `
          <p class="text-base mb-2">${errorMessage}</p>
          ${errorDetails ? `<p class="text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}">${errorDetails}</p>` : ''}
        `,
        icon: 'error',
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#ef4444',
        ...getSwalThemeOptions(),
      })

      // Log error for debugging
      console.error('Error creating/executing project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addBrand = (type: 'own' | 'competitor') => {
    const newBrand: Brand = {
      id: Date.now().toString(),
      name: '',
      type,
      keywords: [],
      urls: []
    }

    if (type === 'own') {
      setProjectData(prev => ({
        ...prev,
        brands: [...prev.brands, newBrand]
      }))
    } else {
      setProjectData(prev => ({
        ...prev,
        competitors: [...prev.competitors, newBrand]
      }))
    }
  }

  const updateBrand = (id: string, field: keyof Brand, value: any) => {
    setProjectData(prev => ({
      ...prev,
      brands: prev.brands.map(brand =>
        brand.id === id ? { ...brand, [field]: value } : brand
      ),
      competitors: prev.competitors.map(brand =>
        brand.id === id ? { ...brand, [field]: value } : brand
      )
    }))
  }

  const removeBrand = (id: string, type: 'own' | 'competitor') => {
    if (type === 'own') {
      setProjectData(prev => ({
        ...prev,
        brands: prev.brands.filter(brand => brand.id !== id)
      }))
    } else {
      setProjectData(prev => ({
        ...prev,
        competitors: prev.competitors.filter(brand => brand.id !== id)
      }))
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Tên Project *</label>
              <input
                type="text"
                value={projectData.name}
                onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ví dụ: Coffee Shop Analysis 2024"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mô tả (tùy chọn)</label>
              <textarea
                value={projectData.description}
                onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
                placeholder="Mô tả ngắn gọn về mục đích của project này..."
              />
            </div>

            {/* Date Range Selection */}
            <div className="bg-muted/30 rounded-lg p-4 border border-amber-300/60 dark:border-white/20">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Khoảng thời gian phân tích</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Từ ngày *</label>
                  <input
                    type="date"
                    value={projectData.fromDate}
                    max={today}
                    onChange={(e) => setProjectData(prev => ({ ...prev, fromDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {errors.fromDate && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.fromDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Đến ngày *</label>
                  <input
                    type="date"
                    value={projectData.toDate}
                    max={today}
                    min={projectData.fromDate || undefined}
                    onChange={(e) => setProjectData(prev => ({ ...prev, toDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {errors.toDate && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.toDate}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-3 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Khoảng thời gian không được vượt quá ngày hôm nay
              </p>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Thương hiệu của bạn</h3>
              <button
                onClick={() => addBrand('own')}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Thêm thương hiệu
              </button>
            </div>

            {projectData.brands.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có thương hiệu nào. Hãy thêm thương hiệu đầu tiên!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projectData.brands.map((brand, index) => (
                  <motion.div
                    key={brand.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-muted/50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Thương hiệu {index + 1}</h4>
                      <button
                        onClick={() => removeBrand(brand.id, 'own')}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Tên thương hiệu *</label>
                        <input
                          type="text"
                          value={brand.name}
                          onChange={(e) => updateBrand(brand.id, 'name', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent ${
                            errors[`brand_name_${index}`] ? 'border-red-500' : 'border-border'
                          }`}
                          placeholder="Ví dụ: Highlands Coffee"
                        />
                        {errors[`brand_name_${index}`] && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors[`brand_name_${index}`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Từ khóa (cách nhau bởi dấu phẩy) *</label>
                        <input
                          type="text"
                          value={keywordInputs[`brand_${brand.id}`] ?? brand.keywords.join(', ')}
                          onChange={(e) => {
                            const value = e.target.value
                            // Validate: only lowercase, no accents, no spaces, no special chars except comma
                            const isValid = /^[a-z0-9,]*$/.test(value)
                            if (!isValid && value !== '') {
                              // Set error if invalid characters detected
                              setErrors(prev => ({
                                ...prev,
                                [`brand_keywords_${index}`]: 'Chỉ được phép nhập chữ thường không dấu, số và dấu phẩy'
                              }))
                            } else {
                              // Clear error if valid
                              setErrors(prev => {
                                const newErrors = { ...prev }
                                delete newErrors[`brand_keywords_${index}`]
                                return newErrors
                              })
                            }
                            // Store raw input without splitting
                            setKeywordInputs(prev => ({
                              ...prev,
                              [`brand_${brand.id}`]: value
                            }))
                          }}
                          onBlur={(e) => {
                            const value = e.target.value
                            // Validate format before saving
                            const isValid = /^[a-z0-9,]*$/.test(value)
                            if (!isValid && value !== '') {
                              setErrors(prev => ({
                                ...prev,
                                [`brand_keywords_${index}`]: 'Chỉ được phép nhập chữ thường không dấu, số và dấu phẩy'
                              }))
                              return
                            }
                            // Split and save keywords on blur
                            const keywords = value.split(',').map(k => k.trim()).filter(k => k)
                            updateBrand(brand.id, 'keywords', keywords)
                            // Clear raw input state
                            setKeywordInputs(prev => {
                              const newInputs = { ...prev }
                              delete newInputs[`brand_${brand.id}`]
                              return newInputs
                            })
                          }}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent ${
                            errors[`brand_keywords_${index}`] ? 'border-red-500' : 'border-border'
                          }`}
                          placeholder="highlands,highlandscoffee,hc"
                        />
                        {errors[`brand_keywords_${index}`] && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors[`brand_keywords_${index}`]}
                          </p>
                        )}
                        {brand.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {brand.keywords.map((keyword, kidx) => (
                              <span
                                key={kidx}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {errors.brands && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.brands}
              </p>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Đối thủ cạnh tranh</h3>
              <button
                onClick={() => addBrand('competitor')}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Thêm đối thủ
              </button>
            </div>

            {projectData.competitors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có đối thủ nào. Hãy thêm đối thủ để so sánh!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projectData.competitors.map((competitor, index) => (
                  <motion.div
                    key={competitor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-muted/50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Đối thủ {index + 1}</h4>
                      <button
                        onClick={() => removeBrand(competitor.id, 'competitor')}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Tên đối thủ *</label>
                        <input
                          type="text"
                          value={competitor.name}
                          onChange={(e) => updateBrand(competitor.id, 'name', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent ${
                            errors[`competitor_name_${index}`] ? 'border-red-500' : 'border-border'
                          }`}
                          placeholder="Ví dụ: Starbucks"
                        />
                        {errors[`competitor_name_${index}`] && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors[`competitor_name_${index}`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Từ khóa (cách nhau bởi dấu phẩy) *</label>
                        <input
                          type="text"
                          value={keywordInputs[`competitor_${competitor.id}`] ?? competitor.keywords.join(', ')}
                          onChange={(e) => {
                            const value = e.target.value
                            // Validate: only lowercase, no accents, no spaces, no special chars except comma
                            const isValid = /^[a-z0-9,]*$/.test(value)
                            if (!isValid && value !== '') {
                              // Set error if invalid characters detected
                              setErrors(prev => ({
                                ...prev,
                                [`competitor_keywords_${index}`]: 'Chỉ được phép nhập chữ thường không dấu, số và dấu phẩy'
                              }))
                            } else {
                              // Clear error if valid
                              setErrors(prev => {
                                const newErrors = { ...prev }
                                delete newErrors[`competitor_keywords_${index}`]
                                return newErrors
                              })
                            }
                            // Store raw input without splitting
                            setKeywordInputs(prev => ({
                              ...prev,
                              [`competitor_${competitor.id}`]: value
                            }))
                          }}
                          onBlur={(e) => {
                            const value = e.target.value
                            // Validate format before saving
                            const isValid = /^[a-z0-9,]*$/.test(value)
                            if (!isValid && value !== '') {
                              setErrors(prev => ({
                                ...prev,
                                [`competitor_keywords_${index}`]: 'Chỉ được phép nhập chữ thường không dấu, số và dấu phẩy'
                              }))
                              return
                            }
                            // Split and save keywords on blur
                            const keywords = value.split(',').map(k => k.trim()).filter(k => k)
                            updateBrand(competitor.id, 'keywords', keywords)
                            // Clear raw input state
                            setKeywordInputs(prev => {
                              const newInputs = { ...prev }
                              delete newInputs[`competitor_${competitor.id}`]
                              return newInputs
                            })
                          }}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent ${
                            errors[`competitor_keywords_${index}`] ? 'border-red-500' : 'border-border'
                          }`}
                          placeholder="starbucks,sbux,starbucksvietnam"
                        />
                        {errors[`competitor_keywords_${index}`] && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors[`competitor_keywords_${index}`]}
                          </p>
                        )}
                        {competitor.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {competitor.keywords.map((keyword, kidx) => (
                              <span
                                key={kidx}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs rounded-md"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {errors.competitors && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.competitors}
              </p>
            )}
          </div>
        )

      case 4:
        return (
          <ProjectPreviewStep
            projectData={projectData}
            dryRunData={dryRunData}
            isLoading={isLoadingPreview}
            error={previewError}
            onBack={handlePrevious}
            onNext={handleNext}
            onRetry={handleRetryPreview}
            onTriggerRealPreview={handleTriggerRealPreview}
          />
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Xác nhận thông tin</h3>
              <p className="text-muted-foreground">Kiểm tra lại thông tin trước khi tạo project</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <div>
                <h4 className="font-medium mb-2">Tên Project</h4>
                <p className="text-muted-foreground">{projectData.name}</p>
              </div>

              {projectData.description && (
                <div>
                  <h4 className="font-medium mb-2">Mô tả</h4>
                  <p className="text-muted-foreground">{projectData.description}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Khoảng thời gian
                </h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{new Date(projectData.fromDate).toLocaleDateString('vi-VN')}</span>
                  <span>→</span>
                  <span>{new Date(projectData.toDate).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Thương hiệu của bạn ({projectData.brands.length})</h4>
                <div className="space-y-2">
                  {projectData.brands.map((brand, index) => (
                    <div key={brand.id} className="bg-background/50 rounded-md p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="text-sm font-medium">{brand.name}</span>
                      </div>
                      {brand.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 ml-4">
                          {brand.keywords.map((keyword, kidx) => (
                            <span
                              key={kidx}
                              className="inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary text-xs rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Đối thủ cạnh tranh ({projectData.competitors.length})</h4>
                <div className="space-y-2">
                  {projectData.competitors.map((competitor, index) => (
                    <div key={competitor.id} className="bg-background/50 rounded-md p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="text-sm font-medium">{competitor.name}</span>
                      </div>
                      {competitor.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 ml-4">
                          {competitor.keywords.map((keyword, kidx) => (
                            <span
                              key={kidx}
                              className="inline-flex items-center px-2 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`bg-background rounded-lg shadow-xl w-full ${
            currentStep === 4 ? 'max-w-6xl' : 'max-w-2xl'
          } max-h-[90vh] overflow-hidden`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-amber-300/60 dark:border-white/20">
            <div>
              <h2 className="text-xl font-semibold">Tạo Project Mới</h2>
              <p className="text-sm text-muted-foreground">
                Bước {currentStep} / {steps.length}: {steps[currentStep - 1].title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {}
          <div className="px-6 py-4 border-b border-amber-300/60 dark:border-white/20">
            <div className="flex items-center gap-2">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep > step.id
                        ? 'bg-primary text-primary-foreground'
                        : currentStep === step.id
                        ? 'bg-primary/20 text-primary border-2 border-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 ${
                      currentStep > step.id ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {renderStepContent()}
          </div>

          {/* Hide navigation for step 4 (preview) as it has its own navigation */}
          {currentStep !== 4 && (
            <div className="flex items-center justify-between p-6 border-t border-amber-300/60 dark:border-white/20">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </button>

              <div className="flex items-center gap-3">
                {currentStep < steps.length ? (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Tiếp theo
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleComplete}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Tạo Project
                    </>
                  )}
                </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
