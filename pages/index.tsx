import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const Home: NextPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            Welcome to INT SOLUTION
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Modern diagram tool with drag & drop functionality, similar to draw.io
          </p>
        </div>
      </main>
      <Footer />
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

export default Home
