import React from 'react';
import {StrictMode, Component, type ErrorInfo, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

type Props = {children: ReactNode};
type State = {hasError: boolean; message: string};

class PortfolioErrorBoundary extends Component<Props, State> {
  state: State = {hasError: false, message: ''};

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'An unexpected rendering error occurred.',
    };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('FARINAS portfolio render error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="runtime-fallback" role="alert">
        <div className="runtime-fallback-card">
          <span className="runtime-fallback-kicker">FARINAS PORTFOLIO</span>
          <h1>Something went wrong while loading the experience.</h1>
          <p>The page hit a browser-side rendering error. Refresh once to retry the application.</p>
          <button type="button" onClick={() => window.location.reload()}>Reload portfolio</button>
          <small>{this.state.message}</small>
        </div>
      </main>
    );
  }
}

const root = document.getElementById('root');
if (!root) {
  throw new Error('Portfolio root element was not found.');
}

createRoot(root).render(
  <StrictMode>
    <PortfolioErrorBoundary>
      <App />
    </PortfolioErrorBoundary>
  </StrictMode>,
);
