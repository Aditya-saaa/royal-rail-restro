import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/api/services';
import { Seo } from '@/seo/Seo';
import { QueryState } from '@/components/common/QueryState';

export function FaqsPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['faqs'],
    queryFn: () => contentApi.faqs(),
    staleTime: 60_000,
    retry: 3,
  });
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
        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={!isLoading && !isError && !data?.length}
          emptyTitle="No FAQs yet"
          emptyDescription="Check back soon, or reach out to us directly with any questions."
          onRetry={() => refetch()}
        >
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
        </QueryState>
      </div>
    </>
  );
}
