import { useTranslation } from 'next-i18next'
import { Facebook, Twitter, Linkedin, Instagram, Youtube, Mail } from 'lucide-react'

const footerLinks = {
  product: [
    { key: 'features', href: '#features' },
    { key: 'solutions', href: '#solutions' },
    { key: 'pricing', href: '#pricing' },
  ],
  company: [
    { key: 'aboutUs', href: '#about' },
    { key: 'careers', href: '#careers' },
    { key: 'blog', href: '#blog' },
    { key: 'contact', href: '#contact' },
  ],
  support: [
    { key: 'documentation', href: '#docs' },
    { key: 'helpCenter', href: '#help' },
    { key: 'community', href: '#community' },
  ],
  legal: [
    { key: 'privacy', href: '#privacy' },
    { key: 'terms', href: '#terms' },
  ],
}

const socialLinks = [
  { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
  { icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
]

export default function LandingFooter() {
  const { t } = useTranslation('common')

  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
          {/* Brand & Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
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
              <h2 className="text-lg font-bold" style={{ color: '#E74C3C' }}>
                {t('navbar.brand')}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              {t('landing.footer.description')}
            </p>

            {/* Social Links */}
            <div>
              <h3 className="text-sm font-semibold mb-3">{t('landing.footer.followUs')}</h3>
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border/40 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      aria-label={social.label}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold mb-4">{t('landing.footer.product')}</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t(`landing.footer.${link.key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold mb-4">{t('landing.footer.company')}</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t(`landing.footer.${link.key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold mb-4">{t('landing.footer.support')}</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t(`landing.footer.${link.key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold mb-4">{t('landing.footer.legal')}</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t(`landing.footer.${link.key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/40 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              {t('landing.footer.copyright')}
            </p>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a
                href="mailto:contact@smapsolution.com"
                className="text-sm hover:text-foreground transition-colors"
              >
                contact@smapsolution.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
