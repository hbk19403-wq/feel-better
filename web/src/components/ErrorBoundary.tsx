import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean }

// Catches render-time errors in any child so one broken page can't blank the
// entire app. Shows a friendly fallback with a reload option.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 32, gap: 12 }}>
          <div style={{ fontSize: 44 }}>🌿</div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Something went wrong on this page</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 420 }}>
            We hit an unexpected error. Reloading usually fixes it. If it keeps happening, please let us know.
          </p>
          <button className="btn btn-primary" onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
