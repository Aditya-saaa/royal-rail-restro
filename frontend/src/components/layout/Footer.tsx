import { Link } from 'react-router-dom';
import { FiMapPin, FiPhone, FiMail, FiInstagram, FiFacebook } from 'react-icons/fi';
import { useFeatureStore } from '@/store/featureStore';

const footerLinks = {
  Explore: [
    { to: '/menu', label: 'Full Menu', feature: 'menu' },
    { to: '/rail-special-thali', label: 'Rail Special Thali', feature: 'home_rail_specials' },
    { to: '/chef-specials', label: 'Chef Specials', feature: 'home_chef_specials' },
    { to: '/offers', label: 'Offers', feature: 'offers' },
    { to: '/events', label: 'Events', feature: 'events' },
  ],
  Company: [
    { to: '/about', label: 'About Us', feature: null },
    { to: '/our-story', label: 'Our Story', feature: 'home_story' },
    { to: '/gallery', label: 'Gallery', feature: 'gallery' },
    { to: '/blog', label: 'Blog', feature: 'blog' },
    { to: '/reviews', label: 'Reviews', feature: 'reviews' },
  ],
  Support: [
    { to: '/reservation', label: 'Book a Table', feature: 'table_reservation' },
    { to: '/contact', label: 'Contact', feature: 'contact_form' },
    { to: '/faqs', label: 'FAQs', feature: null },
    { to: '/privacy', label: 'Privacy Policy', feature: null },
    { to: '/terms', label: 'Terms of Service', feature: null },
    { to: '/refund', label: 'Refund Policy', feature: null },
  ],
};

export function Footer() {
  const isVisible = useFeatureStore((s) => s.isVisible);

  return (
    <footer className="border-t border-charcoal-100 bg-charcoal-900 text-cream-100 dark:border-charcoal-700">
      <div className="container-rrr py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal-700 text-gold-400">
                🚂
              </span>
              <div>
                <p className="font-display text-xl font-bold text-gold-400">Royal Rail Restro</p>
                <p className="text-xs uppercase tracking-widest text-charcoal-300">Gaya · Bihar</p>
              </div>
            </div>
            <p className="mb-6 max-w-sm text-sm leading-relaxed text-charcoal-300">
              Premium family dining inspired by classic railway hospitality. North Indian, Chinese,
              Tandoor, and our signature Rail Special Thali.
            </p>
            <ul className="space-y-3 text-sm text-charcoal-200">
              <li className="flex items-start gap-2">
                <FiMapPin className="mt-0.5 shrink-0 text-gold-400" aria-hidden />
                <span>1st Floor, Dev Raj Tower, Gewalbigha, Gaya, Bihar, India</span>
              </li>
              <li className="flex items-center gap-2">
                <FiPhone className="shrink-0 text-gold-400" aria-hidden />
                <a href="tel:+91XXXXXXXXXX" className="hover:text-gold-400">
                  +91-XXXXXXXXXX
                </a>
              </li>
              <li className="flex items-center gap-2">
                <FiMail className="shrink-0 text-gold-400" aria-hidden />
                <a href="mailto:info@royalrailrestro.com" className="hover:text-gold-400">
                  info@royalrailrestro.com
                </a>
              </li>
            </ul>
            <div className="mt-6 flex gap-3">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="rounded-full bg-charcoal-700 p-2.5 hover:bg-royal-700" aria-label="Instagram">
                <FiInstagram />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="rounded-full bg-charcoal-700 p-2.5 hover:bg-royal-700" aria-label="Facebook">
                <FiFacebook />
              </a>
              <a
                href="https://wa.me/91XXXXXXXXXX"
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-charcoal-700 px-3 py-2 text-xs font-semibold hover:bg-green-700"
              >
                WhatsApp
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => {
            const visible = links.filter((l) => !l.feature || isVisible(l.feature));
            if (!visible.length) return null;
            return (
              <div key={title}>
                <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-gold-400">
                  {title}
                </h3>
                <ul className="space-y-2.5">
                  {visible.map((l) => (
                    <li key={l.to}>
                      <Link to={l.to} className="text-sm text-charcoal-300 transition hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="rail-divider my-10" />

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-charcoal-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Royal Rail Restro. All rights reserved.</p>
          <p className="text-center">
            Crafted for premium dining in Gaya · Online ordering & table reservations
          </p>
        </div>
      </div>
    </footer>
  );
}
