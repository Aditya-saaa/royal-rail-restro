import type { ReactNode } from 'react';
import { Seo } from '@/seo/Seo';

function PolicyLayout({ title, path, children }: { title: string; path: string; children: ReactNode }) {
  return (
    <>
      <Seo title={title} path={path} />
      <div className="container-rrr max-w-3xl py-12">
        <h1 className="section-title">{title}</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-charcoal-600 dark:text-charcoal-300">{children}</div>
      </div>
    </>
  );
}

export function PrivacyPage() {
  return (
    <PolicyLayout title="Privacy Policy" path="/privacy">
      <p>Royal Rail Restro (&quot;we&quot;) respects your privacy. We collect account details, order history, reservation data, and contact form submissions solely to operate our restaurant services.</p>
      <p>We do not sell personal data. Payment architecture is designed for secure processors; card data is not stored on our servers. Cookies are used for authentication and preferences.</p>
      <p>Contact info@royalrailrestro.com for data requests. Address: 1st Floor, Dev Raj Tower, Gewalbigha, Gaya, Bihar, India.</p>
    </PolicyLayout>
  );
}

export function TermsPage() {
  return (
    <PolicyLayout title="Terms of Service" path="/terms">
      <p>By using Royal Rail Restro digital services you agree to accurate information for orders and reservations, compliance with house policies, and payment of applicable charges including GST.</p>
      <p>Menu availability and prices may change. We may refuse service for abuse, fraud, or safety concerns. Indian law governs these terms; disputes subject to Gaya jurisdiction.</p>
    </PolicyLayout>
  );
}

export function RefundPage() {
  return (
    <PolicyLayout title="Refund Policy" path="/refund">
      <p>Orders may be cancelled before kitchen preparation begins for a full refund. Once food preparation starts, cancellations may not be eligible.</p>
      <p>Quality issues: contact us within 2 hours of delivery with order number and photos. Approved refunds are processed to the original payment method within 5–7 business days or as store credit/loyalty points.</p>
      <p>Reservations can be cancelled free of charge up to 2 hours before the slot.</p>
    </PolicyLayout>
  );
}
