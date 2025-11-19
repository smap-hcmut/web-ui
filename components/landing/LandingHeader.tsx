import { useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import { Moon, Sun, Globe, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { key: 'home', href: '#home' },
  { key: 'features', href: '#features' },
  { key: 'solutions', href: '#solutions' },
  { key: 'feedback', href: '#feedback' },
  { key: 'pricing', href: '#pricing' },
  { key: 'aboutUs', href: '#about' },
  { key: 'contact', href: '#contact' },
]

export default function LandingHeader() {
  const router = useRouter()
  const { t, i18n } = useTranslation('common')
  const { theme, setTheme } = useTheme()
  const [langOpen, setLangOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    router.push(router.pathname, router.asPath, { locale: lang })
    setLangOpen(false)
  }

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const targetId = href.replace('#', '')
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex h-10 w-10 items-center justify-center">
              <svg
                className="w-10 h-10"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  fill="#E74C3C"
                  stroke="#E74C3C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-foreground">
              {t('navbar.brand')}
            </h1>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item, index) => (
              <motion.a
                key={item.key}
                href={item.href}
                onClick={(e) => handleSmoothScroll(e, item.href)}
                className="relative px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                {t(`landing.header.${item.key}`)}
              </motion.a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <motion.button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Toggle theme"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </motion.button>

            {/* Language Selector */}
            <div className="relative">
              <motion.button
                onClick={() => setLangOpen(!langOpen)}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="Change language"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline-block">{i18n.language.toUpperCase()}</span>
              </motion.button>

              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-32 rounded-md border bg-popover p-1 shadow-lg"
                >
                  <button
                    onClick={() => changeLanguage('en')}
                    className={cn(
                      'w-full rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent',
                      i18n.language === 'en' && 'bg-accent'
                    )}
                  >
                    {t('language.en')}
                  </button>
                  <button
                    onClick={() => changeLanguage('vi')}
                    className={cn(
                      'w-full rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent',
                      i18n.language === 'vi' && 'bg-accent'
                    )}
                  >
                    {t('language.vi')}
                  </button>
                </motion.div>
              )}
            </div>

            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center gap-2 ml-2">
              <motion.a
                href="/login"
                className="px-4 py-2 text-sm font-medium text-foreground transition-colors hover:text-foreground/80"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t('landing.header.login')}
              </motion.a>
              <motion.a
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 shadow-md transition-all hover:shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t('landing.header.getStarted')}
              </motion.a>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/40 py-4"
          >
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  className="px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground hover:bg-accent rounded-md"
                  onClick={(e) => {
                    handleSmoothScroll(e, item.href)
                    setMobileMenuOpen(false)
                  }}
                >
                  {t(`landing.header.${item.key}`)}
                </a>
              ))}
              <div className="flex flex-col gap-2 mt-2 px-4">
                <a
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-center border border-border rounded-md transition-colors hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('landing.header.login')}
                </a>
                <a
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-center text-white bg-gradient-to-r from-blue-600 to-violet-600 rounded-md shadow-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('landing.header.getStarted')}
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  )
}
