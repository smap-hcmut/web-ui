import { useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import { Moon, Sun, Globe, User } from 'lucide-react'
import { cn } from '@/lib/utils'

  const navItems = [
    { key: 'overview', href: '/overview' },
    { key: 'dashboard', href: '/dashboard' },
    { key: 'trendAnalysis', href: '/trend-analysis' },
    { key: 'dataCenter', href: '/data-center' },
    { key: 'workflow', href: '/workflow' },
    { key: 'analyst', href: '/analyst' },
    { key: 'reportWizard', href: '/report-wizard' },
  ]

export default function Navbar() {
  const router = useRouter()
  const { t, i18n } = useTranslation('common')
  const { theme, setTheme } = useTheme()
  const [langOpen, setLangOpen] = useState(false)

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    router.push(router.pathname, router.asPath, { locale: lang })
    setLangOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {}
        <div className="flex items-center gap-8">
          {}
          <div className="flex items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              {t('navbar.brand')}
            </h1>
          </div>

          {}
          <ul className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = router.pathname === item.href
              return (
                <li key={item.key}>
                  <a
                    href={item.href}
                    className={cn(
                      'relative px-4 py-2 text-sm font-medium transition-colors hover:text-foreground/80',
                      isActive ? 'text-foreground' : 'text-foreground/60'
                    )}
                  >
                    {t(`navbar.${item.key}`)}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-violet-600"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>

        {}
        <div className="flex items-center gap-2">
          {}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </button>

          {}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Change language"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline-block">{i18n.language.toUpperCase()}</span>
            </button>

            {langOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-32 rounded-md border bg-popover p-1 shadow-md"
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

          {}
          <button
            className="inline-flex items-center justify-center rounded-full p-1.5 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="User profile"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600">
              <User className="h-4 w-4 text-white" />
            </div>
          </button>
        </div>
      </div>
    </nav>
  )
}
