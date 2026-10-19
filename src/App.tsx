import React, { Component, lazy, Suspense, useState, type ReactNode } from 'react';
import './App.css';

// Example remote, declared in webpack.config.ts. Rename "exampleremote" and the
// slug it points to, or delete both once you wire your own frontends.
const RemoteButton = lazy(() => import('exampleremote/Button'));

/** Keeps the host up when a remote cannot be loaded. */
class RemoteBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? (
      <span className="remote-error">
        Remote "example-remote" is not available. Point webpack.config.ts at one of your own slugs.
      </span>
    ) : (
      this.props.children
    );
  }
}

const App: React.FC = () => {
  const [clicks, setClicks] = useState(0);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Module Federation Host</h1>
        <p>Webpack + React + TypeScript</p>
      </header>
      <main className="app-main">
        <div className="container">
          <h2>Welcome to the Host Application</h2>
          <p>
            This host resolves its remotes through the orchestrator: it never knows,
            and never chooses, which version it is served.
          </p>
          <div className="remote">
            <RemoteBoundary>
              <Suspense fallback={<span>Loading remote…</span>}>
                <RemoteButton onClick={() => setClicks(count => count + 1)}>
                  Clicked {clicks} times
                </RemoteButton>
              </Suspense>
            </RemoteBoundary>
          </div>
          <div className="info-box">
            <h3>Getting Started</h3>
            <ul>
              <li>Declare your remote frontends in webpack.config.ts</li>
              <li>Import and use remote components in your app</li>
              <li>Expose local components for other apps to consume</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
