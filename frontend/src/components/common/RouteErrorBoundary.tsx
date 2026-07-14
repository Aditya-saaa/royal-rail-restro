import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Wraps a lazy-loaded route. If the dynamic import rejects (stale chunk hash
 * after a redeploy, network blip, or a real runtime error in the page module),
 * React would otherwise leave the nearest <Suspense> fallback showing forever
 * with nothing in the console but a red herring. This catches it and shows a
 * retry screen instead.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[RouteErrorBoundary] failed to load route:', error, info.componentStack);
  }

  handleRetry = () => {
    // A stale chunk hash keeps failing until the page reloads and fetches the
    // latest index.html, so a hard reload is the most reliable "retry".
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="container-rrr flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 text-4xl" aria-hidden>
            🚂
          </div>
          <h1 className="font-display text-2xl font-bold text-charcoal-900 dark:text-cream-50">
            This page couldn&apos;t load
          </h1>
          <p className="mt-3 max-w-md text-sm text-charcoal-500">
            Something went wrong fetching this page. This can happen right after a
            new deployment — reloading usually fixes it.
          </p>
          <Button className="mt-6" onClick={this.handleRetry}>
            Reload page
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Last line of defense for the whole app. RouteErrorBoundary only covers
 * errors thrown while loading/rendering a lazy-loaded page; a runtime error
 * thrown by shared chrome (Navbar, MainLayout, Bootstrap, etc.) happens
 * outside any of those boundaries and would otherwise white-screen the app
 * with no feedback at all.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[AppErrorBoundary] unhandled render error:', error, info.componentStack);
  }

  handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 text-5xl" aria-hidden>
            🚂
          </div>
          <h1 className="font-display text-2xl font-bold text-charcoal-900 dark:text-cream-50">
            Something went wrong
          </h1>
          <p className="mt-3 max-w-md text-sm text-charcoal-500">
            An unexpected error stopped the app from loading. Going back to the
            home page usually fixes it.
          </p>
          <Button className="mt-6" onClick={this.handleReload}>
            Back to home
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
