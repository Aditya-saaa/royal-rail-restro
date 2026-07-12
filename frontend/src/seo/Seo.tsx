import { Helmet } from 'react-helmet-async';

interface SeoProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}

const SITE = 'Royal Rail Restro';
const DEFAULT_DESC =
  'Royal Rail Restro — Premium family restaurant at Dev Raj Tower, Gewalbigha, Gaya, Bihar. North Indian, Chinese, Tandoor, Pizza & Rail Special Thali. Reserve a table or order online.';
const BASE = typeof window !== 'undefined' ? window.location.origin : 'https://royalrailrestro.com';

export function Seo({
  title,
  description = DEFAULT_DESC,
  path = '',
  image = `${BASE}/favicon.svg`,
  type = 'website',
  jsonLd,
  noindex = false,
}: SeoProps) {
  const fullTitle = title ? `${title} | ${SITE}` : `${SITE} | Best Family Restaurant in Gaya, Bihar`;
  const url = `${BASE}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE} />
      <meta property="og:locale" content="en_IN" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="geo.region" content="IN-BR" />
      <meta name="geo.placename" content="Gaya" />
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}

export const restaurantJsonLd = {
  '@context': 'https://schema.org',
  '@type': ['Restaurant', 'LocalBusiness', 'FoodEstablishment'],
  name: 'Royal Rail Restro',
  image: 'https://royalrailrestro.com/favicon.svg',
  '@id': 'https://royalrailrestro.com/#restaurant',
  url: 'https://royalrailrestro.com',
  telephone: '+91-XXXXXXXXXX',
  email: 'info@royalrailrestro.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '1st Floor, Dev Raj Tower, Gewalbigha',
    addressLocality: 'Gaya',
    addressRegion: 'Bihar',
    postalCode: '823001',
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 24.7955,
    longitude: 85.0002,
  },
  servesCuisine: [
    'North Indian',
    'Chinese',
    'Tandoor',
    'Fast Food',
    'Pizza',
  ],
  priceRange: '₹₹',
  acceptsReservations: true,
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Sunday'],
      opens: '11:00',
      closes: '22:30',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Friday', 'Saturday'],
      opens: '11:00',
      closes: '23:00',
    },
  ],
  sameAs: [],
};

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${BASE}${it.path}`,
    })),
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Royal Rail Restro',
    url: BASE,
    logo: `${BASE}/favicon.svg`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: '+91-XXXXXXXXXX',
      areaServed: 'IN',
      availableLanguage: ['en', 'hi'],
    },
  };
}
