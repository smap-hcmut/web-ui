import { useTranslation } from 'next-i18next'
import { motion } from 'framer-motion'
import { TrendingUp, MessageCircle, Hash, BarChart3, Heart, Share2, Eye, ThumbsUp } from 'lucide-react'

export default function HeroSection() {
  const { t } = useTranslation('common')

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/90 via-violet-50/80 to-pink-50/90 dark:from-background/95 dark:via-background/90 dark:to-background/95 z-10" />
        <img
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2940&auto=format&fit=crop"
          alt="Analytics Dashboard Background"
          className="absolute inset-0 w-full h-full object-cover opacity-20 dark:opacity-10"
        />
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-block mb-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-violet-100 dark:from-blue-950 dark:to-violet-950 border border-blue-200 dark:border-blue-800">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Social Media Analytics Platform
                </span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                {t('landing.hero.tagline')}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0"
            >
              {t('landing.hero.subtitle')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <motion.a
                href="/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg shadow-lg hover:shadow-xl transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t('landing.hero.cta')}
              </motion.a>
              <motion.button
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold border-2 border-border rounded-lg hover:bg-accent transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t('landing.hero.watchDemo')}
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Right: Illustration Image */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="relative"
            >
              {/* Main Dashboard Image */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-gray-900"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-violet-500/5 z-10" />
                <img
                  src="/images/dashboard-preview.png"
                  alt="Analytics Dashboard"
                  className="w-full h-auto rounded-2xl"
                />
              </motion.div>

              {/* Floating Facebook Comment Card */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
                animate={{ x: [-5, 5, -5] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-8 top-20 bg-card border border-border rounded-xl shadow-lg p-4 w-64"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">Facebook</span>
                      <span className="text-xs text-muted-foreground">2h ago</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      "Amazing product! Highly recommend..."
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-red-500 fill-red-500" />
                        <span>248</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        <span>45</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Share2 className="h-3 w-3" />
                        <span>12</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="px-2 py-1 rounded bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">
                      Positive 😊
                    </div>
                    <span className="text-muted-foreground">95% confidence</span>
                  </div>
                </div>
              </motion.div>

              {/* Floating TikTok Trend Card */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-4 bottom-32 bg-card border border-border rounded-xl shadow-lg p-4 w-56"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center">
                    <Hash className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">TikTok Trend</div>
                    <div className="text-xs text-muted-foreground">Trending now</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">#ProductLaunch</span>
                    <span className="text-muted-foreground">2.5M views</span>
                  </div>
                  <div className="w-full h-1.5 bg-accent rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '85%' }}
                      transition={{ duration: 1, delay: 1.5 }}
                      className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Floating Keyword Card */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.4 }}
                animate={{ rotate: [-2, 2, -2] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-8 top-8 bg-card border border-border rounded-xl shadow-lg p-4 w-52"
              >
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-semibold">Top Keywords</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['AI', 'Marketing', 'Social', 'Analytics', 'Growth'].map((keyword, i) => (
                    <motion.span
                      key={keyword}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 1.6 + i * 0.1 }}
                      className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-blue-100 to-violet-100 dark:from-blue-950 dark:to-violet-950 text-blue-700 dark:text-blue-300 rounded-full"
                    >
                      {keyword}
                    </motion.span>
                  ))}
                </div>
              </motion.div>

              {/* Floating Stats Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.6 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-0 bottom-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-lg p-3 flex items-center gap-2"
              >
                <Eye className="h-5 w-5" />
                <div>
                  <div className="text-xs opacity-90">Real-time</div>
                  <div className="text-sm font-bold">24/7 Monitoring</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-20 right-20 w-72 h-72 bg-blue-400 rounded-full blur-3xl opacity-20 pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute bottom-20 left-20 w-96 h-96 bg-violet-400 rounded-full blur-3xl opacity-20 pointer-events-none"
      />
    </section>
  )
}
