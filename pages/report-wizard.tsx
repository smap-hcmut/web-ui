import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ReportWizard from '@/components/reports/ReportWizard'
import ReportPreview from '@/components/reports/ReportPreview'
import { ReportProvider } from '@/contexts/ReportContext'
import { useIsMobile } from '@/hooks/useResponsive'

const ReportWizardPage: NextPage = () => {
  const { t } = useTranslation('common')
  const isMobile = useIsMobile()

  return (
    <ReportProvider>
      <div className="flex flex-col h-screen bg-background">
        <Navbar />
        
        <main className="flex-1 overflow-hidden">
          <ReportWizardContent />
        </main>
        
        <Footer />
      </div>
    </ReportProvider>
  )
}

const ReportWizardContent: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'wizard' | 'preview'>('wizard')
  const [reportData, setReportData] = useState<any>(null)

  const handleReportGenerated = (data: any) => {
    setReportData(data)
    setCurrentStep('preview')
  }

  const handleBackToWizard = () => {
    setCurrentStep('wizard')
    setReportData(null)
  }

  return (
    <div className="h-full">
      {currentStep === 'wizard' ? (
        <ReportWizard onReportGenerated={handleReportGenerated} />
      ) : (
        <ReportPreview 
          reportData={reportData} 
          onBack={handleBackToWizard}
        />
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

export default ReportWizardPage
