import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { contentApi } from '@/api/services';
import { Seo } from '@/seo/Seo';
import { PageLoader } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import { FeatureGate } from '@/components/common/FeatureGate';
import { QueryState } from '@/components/common/QueryState';

export function BlogPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['blog'],
    queryFn: () => contentApi.blog(),
    staleTime: 60_000,
    retry: 3,
  });
  return (
    <FeatureGate featureKey="blog" title="Blog is currently unavailable">
      <Seo title="Blog" path="/blog" />
      <div className="container-rrr py-12">
        <h1 className="section-title">Blog</h1>
        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={!isLoading && !isError && !data?.items.length}
          emptyTitle="No posts yet"
          emptyDescription="Our team is working on the first post — check back soon."
          onRetry={() => refetch()}
        >
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {data?.items.map((p) => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="card transition hover:shadow-royal">
                {p.cover_image && <img src={p.cover_image} alt="" className="mb-4 h-40 w-full rounded-xl object-cover" />}
                <h2 className="font-display text-xl font-semibold">{p.title}</h2>
                <p className="mt-2 text-sm text-charcoal-500">{p.excerpt}</p>
              </Link>
            ))}
          </div>
        </QueryState>
      </div>
    </FeatureGate>
  );
}

export function BlogPostPage() {
  const { slug = '' } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['blog', slug],
    queryFn: () => contentApi.blogPost(slug),
    enabled: !!slug,
  });
  if (isLoading) return <PageLoader />;
  if (!data) return <div className="container-rrr py-20">Post not found</div>;
  return (
    <>
      <Seo title={data.title} description={data.excerpt || undefined} path={`/blog/${data.slug}`} />
      <article className="container-rrr max-w-3xl py-12">
        <h1 className="font-display text-4xl font-bold">{data.title}</h1>
        {data.published_at && <p className="mt-2 text-sm text-charcoal-400">{formatDate(data.published_at)}</p>}
        <div className="prose mt-8 max-w-none whitespace-pre-wrap dark:prose-invert">{data.content}</div>
      </article>
    </>
  );
}
