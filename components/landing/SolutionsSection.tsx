import { useTranslation } from 'next-i18next'
import { motion } from 'framer-motion'
import { Shield, TrendingUp, Users, Rocket, Lightbulb, Sparkles } from 'lucide-react'

const solutions = [
  {
    icon: Shield,
    titleKey: 'solution1Title',
    descriptionKey: 'solution1Description',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  {
    icon: TrendingUp,
    titleKey: 'solution2Title',
    descriptionKey: 'solution2Description',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
  },
  {
    icon: Users,
    titleKey: 'solution3Title',
    descriptionKey: 'solution3Description',
    color: 'from-pink-500 to-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
  },
  {
    icon: Rocket,
    titleKey: 'solution4Title',
    descriptionKey: 'solution4Description',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
  },
  {
    icon: Lightbulb,
    titleKey: 'solution5Title',
    descriptionKey: 'solution5Description',
    color: 'from-yellow-500 to-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
  },
  {
    icon: Sparkles,
    titleKey: 'solution6Title',
    descriptionKey: 'solution6Description',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
  },
]

export default function SolutionsSection() {
  const { t } = useTranslation('common')

  return (
    <section id="solutions" className="relative py-24 bg-background overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t('landing.solutions.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('landing.solutions.subtitle')}
          </p>
        </motion.div>

        {/* Solutions Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutions.map((solution, index) => {
              const Icon = solution.icon
              return (
                <motion.div
                  key={solution.titleKey}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="group"
                >
                  <div className="h-full p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
                    {/* Icon */}
                    <div className={`inline-flex p-3 rounded-xl ${solution.bgColor} mb-6`}>
                      <div className={`w-8 h-8 bg-gradient-to-br ${solution.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {t(`landing.solutions.${solution.titleKey}`)}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {t(`landing.solutions.${solution.descriptionKey}`)}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
