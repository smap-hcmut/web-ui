'use client'

import { useTranslation } from 'next-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Quote, ChevronLeft, ChevronRight, Users, TrendingUp, Award } from 'lucide-react'
import { useState } from 'react'

const stats = [
  {
    icon: Users,
    valueKey: 'customersCount',
    labelKey: 'customersLabel',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Star,
    valueKey: 'rating',
    labelKey: 'ratingLabel',
    color: 'from-yellow-500 to-yellow-600',
  },
  {
    icon: TrendingUp,
    valueKey: 'growthRate',
    labelKey: 'growthLabel',
    color: 'from-green-500 to-green-600',
  },
  {
    icon: Award,
    valueKey: 'satisfaction',
    labelKey: 'satisfactionLabel',
    color: 'from-purple-500 to-purple-600',
  },
]

const testimonials = [
  {
    nameKey: 'testimonial1Name',
    positionKey: 'testimonial1Position',
    companyKey: 'testimonial1Company',
    quoteKey: 'testimonial1Quote',
    rating: 5,
    avatar: '/images/avatars/avatar1.jpg',
  },
  {
    nameKey: 'testimonial2Name',
    positionKey: 'testimonial2Position',
    companyKey: 'testimonial2Company',
    quoteKey: 'testimonial2Quote',
    rating: 5,
    avatar: '/images/avatars/avatar2.jpg',
  },
  {
    nameKey: 'testimonial3Name',
    positionKey: 'testimonial3Position',
    companyKey: 'testimonial3Company',
    quoteKey: 'testimonial3Quote',
    rating: 5,
    avatar: '/images/avatars/avatar3.jpg',
  },
]

export default function FeedbackSection() {
  const { t } = useTranslation('common')
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section id="feedback" className="relative py-24 bg-gradient-to-b from-background via-primary/5 to-background overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            {t('landing.feedback.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('landing.feedback.subtitle')}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="max-w-6xl mx-auto mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.labelKey}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-600/10 mb-4">
                    <Icon className={`w-8 h-8 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} style={{ WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} />
                  </div>
                  <motion.div
                    initial={{ scale: 0.5 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                    className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
                  >
                    {t(`landing.feedback.stats.${stat.valueKey}`)}
                  </motion.div>
                  <p className="text-sm text-muted-foreground">
                    {t(`landing.feedback.stats.${stat.labelKey}`)}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Testimonials Carousel */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Quote decoration */}
            <div className="absolute -top-8 -left-4 text-primary/20">
              <Quote className="w-20 h-20" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="bg-card border border-border/50 rounded-3xl p-8 md:p-12 shadow-xl backdrop-blur-sm"
              >
                {/* Rating */}
                <div className="flex gap-1 mb-6 justify-center">
                  {Array.from({ length: testimonials[currentIndex].rating }).map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-lg md:text-xl text-center mb-8 leading-relaxed text-foreground">
                  "{t(`landing.feedback.testimonials.${testimonials[currentIndex].quoteKey}`)}"
                </blockquote>

                {/* Author Info */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/50">
                    {/* Avatar placeholder with gradient */}
                    <div className="w-full h-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                      {t(`landing.feedback.testimonials.${testimonials[currentIndex].nameKey}`).charAt(0)}
                    </div>
                    {/* Uncomment when avatars are provided:
                    <Image
                      src={testimonials[currentIndex].avatar}
                      alt={t(`landing.feedback.testimonials.${testimonials[currentIndex].nameKey}`)}
                      fill
                      className="object-cover"
                    />
                    */}
                  </div>
                  <div className="text-center">
                    <h4 className="font-bold text-lg">
                      {t(`landing.feedback.testimonials.${testimonials[currentIndex].nameKey}`)}
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      {t(`landing.feedback.testimonials.${testimonials[currentIndex].positionKey}`)} • {t(`landing.feedback.testimonials.${testimonials[currentIndex].companyKey}`)}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={prevTestimonial}
                className="p-3 rounded-full bg-card border border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 group"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>

              {/* Dots indicator */}
              <div className="flex items-center gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? 'w-8 bg-primary'
                        : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="p-3 rounded-full bg-card border border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 group"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Case Studies Grid (Optional showcase) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto mt-20"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-12">
            {t('landing.feedback.caseStudiesTitle')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((caseNum, index) => (
              <motion.div
                key={caseNum}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl"
              >
                <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {t(`landing.feedback.caseStudies.case${caseNum}.metric`)}
                </div>
                <h4 className="font-bold mb-2 group-hover:text-primary transition-colors">
                  {t(`landing.feedback.caseStudies.case${caseNum}.title`)}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t(`landing.feedback.caseStudies.case${caseNum}.description`)}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
