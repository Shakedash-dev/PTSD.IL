import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { Phone, MessageCircle } from 'lucide-react';

export default function Footer() {
  const { lang } = useLang();

  return (
    <footer className="bg-foreground/5 border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t(lang, 'hero_subtitle')}
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-sm mb-3 text-foreground">מידע ותמיכה</h4>
            <ul className="space-y-2">
              {[
                { key: 'ptsd_info', path: '/ptsd-info' },
                { key: 'self_help', path: '/self-help' },
                { key: 'treatment', path: '/treatment' },
                { key: 'rights', path: '/rights' },
              ].map(item => (
                <li key={item.key}>
                  <Link to={item.path} className="text-sm text-muted-foreground hover:text-primary transition-natural">
                    {t(lang, item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Emergency */}
          <div>
            <h4 className="font-semibold text-sm mb-3 text-foreground">קו חירום - ער״ן</h4>
            <div className="flex gap-2">
              <a
                href="tel:1201"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-muted hover:bg-border text-foreground rounded-xl text-sm font-medium transition-colors duration-300"
              >
                <Phone className="w-4 h-4" />
                1201
              </a>
              <a
                href="https://api.whatsapp.com/send?phone=9720528451201"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-muted hover:bg-border text-foreground rounded-xl text-sm font-medium transition-colors duration-300"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              {t(lang, 'footer_disclaimer')}
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            האתר נכתב בשיתוף עם{' '}
            <a
              href="https://metiv.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-natural underline"
            >
              מטיב - המרכז לפסיכוטראומה
            </a>
          </p>
          <Link to="/sources" className="hover:text-primary transition-natural">
            {t(lang, 'sources')}
          </Link>
        </div>
      </div>
    </footer>
  );
}