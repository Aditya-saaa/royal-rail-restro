/**
 * Real Developer Console — wired to /api/v1/developer/*
 */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from '@/api/client';
import { Seo } from '@/seo/Seo';
import { AdminPageSkeleton } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type ConsoleData = {
  app: { name: string; version: string; env: string; debug: boolean; timestamp: string; console_build_ms: number };
  health: {
    status: string;
    database: string;
    database_latency_ms: number | null;
    redis: string;
    redis_latency_ms: number | null;
    cloudinary: string;
    storage: string;
  };
  counts: Record<string, number>;
  maintenance_mode: boolean;
  safe_env: Record<string, string>;
  services: Record<string, boolean>;
  runtime: { python: string; platform: string; pid: number };
};

export function DeveloperConsoleHome() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['dev-console'],
    queryFn: () => api.get<ConsoleData>('/developer/console').then((r) => r.data),
    staleTime: 15_000,
    refetchInterval: 60_000,
  });

  const [probePath, setProbePath] = useState('/health');
  const [probeResult, setProbeResult] = useState('');
  const [seedMsg, setSeedMsg] = useState('');
  const [maintMsg, setMaintMsg] = useState('');

  const maintenance = useMutation({
    mutationFn: (enabled: boolean) =>
      api.post('/developer/maintenance', {
        enabled,
        message: enabled
          ? 'Royal Rail Restro is under scheduled maintenance. We will be back shortly.'
          : '',
      }),
    onSuccess: (_, enabled) => {
      setMaintMsg(enabled ? 'Maintenance ON' : 'Maintenance OFF');
      qc.invalidateQueries({ queryKey: ['dev-console'] });
    },
    onError: (e) => setMaintMsg(getErrorMessage(e)),
  });

  const seed = useMutation({
    mutationFn: () => api.post('/developer/seed'),
    onSuccess: (res) => {
      setSeedMsg(JSON.stringify(res.data, null, 2));
      qc.invalidateQueries({ queryKey: ['dev-console'] });
    },
    onError: (e) => setSeedMsg(getErrorMessage(e)),
  });

  const probe = useMutation({
    mutationFn: () => api.post('/developer/probe', { path: probePath, method: 'GET' }),
    onSuccess: (res) => setProbeResult(JSON.stringify(res.data, null, 2)),
    onError: (e) => setProbeResult(getErrorMessage(e)),
  });

  if (isLoading && !data) return <AdminPageSkeleton />;
  if (isError && !data) {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-950/30 p-6 text-red-100">
        <p className="font-semibold">Developer console failed to load</p>
        <p className="mt-2 text-sm">{getErrorMessage(error)}</p>
        <p className="mt-2 text-xs opacity-80">
          Ensure you are logged in as admin/superuser (developer role) and backend includes /api/v1/developer/console.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const h = data!.health;
  const ok = (v: string) => v === 'ok' || v === 'configured' || v === 'healthy';

  return (
    <>
      <Seo title="Developer Console" noindex />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gold-400">Developer Console</h1>
          <p className="text-sm text-charcoal-300">
            {data!.app.name} v{data!.app.version} · {data!.app.env} · probe {data!.app.console_build_ms}ms
            {isFetching ? ' · refreshing…' : ''}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} loading={isFetching}>
          Refresh metrics
        </Button>
      </div>

      {/* Health grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Overall', value: h.status, detail: data!.app.timestamp },
          {
            label: 'Database',
            value: h.database,
            detail: h.database_latency_ms != null ? `${h.database_latency_ms} ms` : '—',
          },
          {
            label: 'Redis',
            value: h.redis,
            detail: h.redis_latency_ms != null ? `${h.redis_latency_ms} ms` : 'optional',
          },
          { label: 'Cloudinary', value: h.cloudinary, detail: h.storage },
        ].map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl border p-4 ${
              ok(card.value)
                ? 'border-green-500/30 bg-green-950/20'
                : 'border-amber-500/40 bg-amber-950/20'
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-charcoal-400">{card.label}</p>
            <p className="mt-1 font-mono text-lg font-semibold text-cream-50">{card.value}</p>
            <p className="mt-1 text-xs text-charcoal-400">{card.detail}</p>
          </div>
        ))}
      </div>

      {/* Counts */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries(data!.counts).map(([k, v]) => (
          <div key={k} className="rounded-xl border border-charcoal-700 bg-charcoal-800/80 p-3">
            <p className="text-[10px] uppercase text-charcoal-400">{k.replace('_', ' ')}</p>
            <p className="font-display text-xl font-bold text-gold-400">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Maintenance */}
        <section className="rounded-2xl border border-charcoal-700 bg-charcoal-800/60 p-5">
          <h2 className="font-display text-lg font-semibold text-cream-50">Maintenance mode</h2>
          <p className="mt-1 text-sm text-charcoal-400">
            Status: {data!.maintenance_mode ? 'ON — site may show maintenance message' : 'OFF'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="gold"
              loading={maintenance.isPending}
              onClick={() => maintenance.mutate(true)}
            >
              Enable maintenance
            </Button>
            <Button
              variant="outline"
              loading={maintenance.isPending}
              onClick={() => maintenance.mutate(false)}
            >
              Disable
            </Button>
          </div>
          {maintMsg && <p className="mt-2 text-xs text-charcoal-300">{maintMsg}</p>}
        </section>

        {/* Seed */}
        <section className="rounded-2xl border border-charcoal-700 bg-charcoal-800/60 p-5">
          <h2 className="font-display text-lg font-semibold text-cream-50">Database seed</h2>
          <p className="mt-1 text-sm text-charcoal-400">
            Idempotent seed: roles, admin, menu, content, feature catalog.
          </p>
          <Button className="mt-4" loading={seed.isPending} onClick={() => seed.mutate()}>
            Run seed now
          </Button>
          {seedMsg && (
            <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-charcoal-950 p-3 text-[11px] text-cream-100">
              {seedMsg}
            </pre>
          )}
        </section>

        {/* API probe */}
        <section className="rounded-2xl border border-charcoal-700 bg-charcoal-800/60 p-5">
          <h2 className="font-display text-lg font-semibold text-cream-50">API probe</h2>
          <p className="mt-1 text-sm text-charcoal-400">Latency check for allow-listed paths only.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              className="input max-w-xs bg-charcoal-900 text-cream-50"
              value={probePath}
              onChange={(e) => setProbePath(e.target.value)}
            >
              {[
                '/health',
                '/api/v1/home',
                '/api/v1/restaurant',
                '/api/v1/menu/categories',
                '/api/v1/features/public',
                '/api/v1/admin/db-stats',
              ].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <Button loading={probe.isPending} onClick={() => probe.mutate()}>
              Probe
            </Button>
          </div>
          {probeResult && (
            <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-charcoal-950 p-3 text-[11px] text-cream-100">
              {probeResult}
            </pre>
          )}
        </section>

        {/* Safe env */}
        <section className="rounded-2xl border border-charcoal-700 bg-charcoal-800/60 p-5">
          <h2 className="font-display text-lg font-semibold text-cream-50">Safe environment</h2>
          <p className="mt-1 text-xs text-charcoal-400">Secrets never exposed.</p>
          <dl className="mt-3 space-y-1 font-mono text-xs">
            {Object.entries(data!.safe_env).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-charcoal-700/60 py-1">
                <dt className="text-charcoal-400">{k}</dt>
                <dd className="text-right text-cream-100">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-charcoal-500">
            Runtime: Python {data!.runtime.python} · {data!.runtime.platform} · pid {data!.runtime.pid}
          </p>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link className="text-gold-400 underline" to="/developer/logs">
          Activity logs →
        </Link>
        <Link className="text-gold-400 underline" to="/developer/flags">
          Feature flags →
        </Link>
        <Link className="text-gold-400 underline" to="/developer/theme">
          Theme →
        </Link>
        <Link className="text-gold-400 underline" to="/admin">
          Admin panel →
        </Link>
      </div>
    </>
  );
}

export function DeveloperLogsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dev-logs'],
    queryFn: () => api.get('/developer/logs', { params: { page: 1, page_size: 50 } }).then((r) => r.data),
  });
  const items =
    (data as { items?: { id: string; action: string; entity_type?: string; status: string; created_at?: string; details?: string }[] })
      ?.items || [];

  if (isLoading) return <AdminPageSkeleton />;

  return (
    <>
      <Seo title="Activity Logs" noindex />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gold-400">Activity Logs</h1>
        <Button variant="outline" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>
      {!items.length && <p className="text-charcoal-400">No activity logged yet.</p>}
      <div className="space-y-2">
        {items.map((l) => (
          <div
            key={l.id}
            className="rounded-lg border border-charcoal-700 bg-charcoal-800/50 px-4 py-3 font-mono text-xs text-cream-100"
          >
            <span className="text-gold-400">{l.action}</span>
            {l.entity_type ? ` · ${l.entity_type}` : ''} · {l.status}
            {l.created_at ? ` · ${l.created_at}` : ''}
            {l.details ? <p className="mt-1 text-charcoal-400">{l.details}</p> : null}
          </div>
        ))}
      </div>
    </>
  );
}
