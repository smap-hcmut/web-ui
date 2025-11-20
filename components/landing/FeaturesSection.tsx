import { useTranslation } from 'next-i18next'
import { motion } from 'framer-motion'
import Image from 'next/image'

const features = [
  {
    step: '1',
    titleKey: 'step1Title',
    descriptionKey: 'step1Description',
    image: '/images/features/1.png',
    alignment: 'left',
  },
  {
    step: '2',
    titleKey: 'step2Title',
    descriptionKey: 'step2Description',
    image: '/images/features/2.png',
    alignment: 'right',
  },
  {
    step: '3',
    titleKey: 'step3Title',
    descriptionKey: 'step3Description',
    image: '/images/features/3.png',
    alignment: 'left',
  },
]

export default function FeaturesSection() {
  const { t } = useTranslation('common')

  return (
    <section id="features" className="relative py-24 bg-gradient-to-b from-background via-muted/30 to-background overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            {t('landing.features.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('landing.features.subtitle')}
          </p>
        </motion.div>

        {/* Features Steps */}
        <div className="max-w-6xl mx-auto space-y-20">
          {features.map((feature, index) => (
            <motion.div
              key={feature.step}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`flex flex-col ${
                feature.alignment === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'
              } items-center gap-8 md:gap-12`}
            >
              {/* Text Content */}
              <div className="flex-1 space-y-4">
                <div className="inline-block">
                  <span className="text-5xl md:text-6xl font-bold bg-gradient-to-br from-primary/20 to-purple-600/20 bg-clip-text text-transparent">
                    {feature.step}.
                  </span>
                </div>

                <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {t(`landing.features.${feature.titleKey}`)}
                </h3>

                <p className="text-base text-muted-foreground leading-relaxed">
                  {t(`landing.features.${feature.descriptionKey}`)}
                </p>
              </div>

              {/* Image */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="flex-1 relative"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-muted/30 backdrop-blur-sm">
                  <Image
                    src={feature.image}
                    alt={t(`landing.features.${feature.titleKey}`)}
                    width={600}
                    height={450}
                    className="w-full h-auto"
                  />
                </div>

                {/* Decorative gradient blur */}
                <div
                  className={`absolute -z-10 w-3/4 h-3/4 bg-gradient-to-br from-primary/20 to-purple-600/20 blur-3xl ${
                    feature.alignment === 'right' ? '-left-20' : '-right-20'
                  } top-1/2 -translate-y-1/2`}
                />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-20"
        >
          <button className="px-8 py-4 bg-gradient-to-r from-primary to-purple-600 text-primary-foreground rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300">
            {t('landing.features.cta')}
          </button>
        </motion.div>
      </div>
    </section>
  )
}
