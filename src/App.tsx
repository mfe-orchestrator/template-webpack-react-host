import React from 'react';
import './App.css';

const App: React.FC = () => {
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
            This is a Module Federation host application built with Webpack 5,
            React, and TypeScript.
          </p>
          <div className="info-box">
            <h3>Getting Started</h3>
            <ul>
              <li>Add remote microfrontends in webpack.config.js</li>
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
