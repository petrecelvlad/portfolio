import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// React Error Boundaries must be class components — there is no hook equivalent. Catches
// errors thrown during render, lifecycle methods, and effects in the subtree below it (not
// errors thrown in event handlers or in requestAnimationFrame callbacks, which run outside
// React's own call stack). Without one anywhere in this app, any uncaught error unmounts the
// entire page — this is the safety net for whatever the next unexpected failure turns out to
// be, not a substitute for fixing a known failure mode at its source.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // This project has no @types/react installed (a pre-existing gap, not introduced here —
  // every hook/component elsewhere silently falls back to `any`, so it's never surfaced before
  // now). Without real types, whatever TS infers for the imported `Component` class doesn't
  // reliably carry `props`/`state` as members, so `declare` them explicitly rather than relying
  // on inheriting them.
  declare props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('ErrorBoundary caught an error in a subtree, rendering the fallback instead:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
