import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/api/services';
import { Seo } from '@/seo/Seo';
import { PageLoader } from '@/components/ui/Spinner';

export function FaqsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['faqs'], queryFn: () => contentApi.faqs() });
  const jsonLd = data
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: data.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }
    : undefined;
  return (
    <>
      <Seo title="FAQs" path="/faqs" jsonLd={jsonLd} />
      <div className="container-rrr max-w-3xl py-12">
        <h1 className="section-title">Frequently Asked Questions</h1>
        {isLoading ? <PageLoader /> : (
          <div className="mt-8 space-y-3">
            {data?.map((f) => (
              <details key={f.id} className="card group">
                <summary className="cursor-pointer list-none font-semibold marker:content-none">
                  {f.question}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-charcoal-600 dark:text-charcoal-300">{f.answer}</p>
              </details>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
