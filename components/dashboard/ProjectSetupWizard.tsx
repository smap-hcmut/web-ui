import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  Upload,
  Check,
  AlertCircle,
  Target,
  Users,
  BarChart3,
  Sparkles
} from 'lucide-react'

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
  { id: 4, title: 'Xác nhận', description: 'Kiểm tra và tạo project' }
]

export default function ProjectSetupWizard({ isOpen, onClose, onComplete }: ProjectSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    description: '',
    brands: [],
    competitors: []
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!projectData.name.trim()) {
          newErrors.name = 'Tên project là bắt buộc'
        }
        break
      case 2:
        if (projectData.brands.length === 0) {
          newErrors.brands = 'Cần ít nhất một thương hiệu'
        }
        break
      case 3:
        if (projectData.competitors.length === 0) {
          newErrors.competitors = 'Cần ít nhất một đối thủ để so sánh'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleComplete = async () => {
    if (!validateStep(currentStep)) return

    setIsLoading(true)
    try {

      await new Promise(resolve => setTimeout(resolve, 2000))
      onComplete(projectData)
      onClose()
    } catch (error) {
      console.error('Error creating project:', error)
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Tên thương hiệu *</label>
                        <input
                          type="text"
                          value={brand.name}
                          onChange={(e) => updateBrand(brand.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Ví dụ: Highlands Coffee"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Từ khóa (cách nhau bởi dấu phẩy)</label>
                        <input
                          type="text"
                          value={brand.keywords.join(', ')}
                          onChange={(e) => updateBrand(brand.id, 'keywords', e.target.value.split(',').map(k => k.trim()).filter(k => k))}
                          className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="highlands, highlands coffee, hc"
                        />
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Tên đối thủ *</label>
                        <input
                          type="text"
                          value={competitor.name}
                          onChange={(e) => updateBrand(competitor.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Ví dụ: Starbucks"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Từ khóa (cách nhau bởi dấu phẩy)</label>
                        <input
                          type="text"
                          value={competitor.keywords.join(', ')}
                          onChange={(e) => updateBrand(competitor.id, 'keywords', e.target.value.split(',').map(k => k.trim()).filter(k => k))}
                          className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="starbucks, sbux, starbucks vietnam"
                        />
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
                <h4 className="font-medium mb-2">Thương hiệu của bạn ({projectData.brands.length})</h4>
                <div className="space-y-1">
                  {projectData.brands.map((brand, index) => (
                    <div key={brand.id} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-sm">{brand.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Đối thủ cạnh tranh ({projectData.competitors.length})</h4>
                <div className="space-y-1">
                  {projectData.competitors.map((competitor, index) => (
                    <div key={competitor.id} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      <span className="text-sm">{competitor.name}</span>
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
          className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {}
          <div className="flex items-center justify-between p-6 border-b border-border">
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
          <div className="px-6 py-4 border-b border-border">
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

          {}
          <div className="p-6 max-h-96 overflow-y-auto">
            {renderStepContent()}
          </div>

          {}
          <div className="flex items-center justify-between p-6 border-t border-border">
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
