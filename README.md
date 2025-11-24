# Webpack React TypeScript Module Federation Host

A starter template for a Module Federation host application built with Webpack 5, React 18, and TypeScript.

## Features

- Webpack 5 with Module Federation
- React 18 with TypeScript
- Hot Module Replacement (HMR)
- CSS support with style-loader and css-loader
- TypeScript strict mode enabled
- Production-ready webpack configuration

## Project Structure

```
.
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── App.css             # App styles
│   ├── App.tsx             # Main App component
│   ├── bootstrap.tsx       # Bootstrap file for React
│   └── index.ts            # Entry point with dynamic import
├── package.json
├── tsconfig.json
├── webpack.config.js
└── README.md
```

## Getting Started

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm start
```

The application will open at [http://localhost:3000](http://localhost:3000)

Alternative commands:
```bash
npm run dev    # Start dev server without auto-opening browser
```

### Build

Create a production build:

```bash
npm run build
```

### Type Checking

Run TypeScript type checking:

```bash
npm run type-check
```

## Module Federation Configuration

### Adding Remote Microfrontends

To consume remote microfrontends, add them to the `remotes` section in `webpack.config.js`:

```javascript
remotes: {
  remote1: 'remote1@http://localhost:3001/remoteEntry.js',
  remote2: 'remote2@http://localhost:3002/remoteEntry.js',
}
```

Then import and use remote components in your code:

```typescript
import RemoteComponent from 'remote1/Component';
```

### Exposing Components

To expose components from this host for other applications to consume, add them to the `exposes` section:

```javascript
exposes: {
  './Button': './src/components/Button',
  './Header': './src/components/Header',
}
```

### Shared Dependencies

React and React-DOM are configured as shared singleton dependencies with eager loading. This ensures:
- Only one instance of React runs across all microfrontends
- React is loaded immediately with the host application
- Version compatibility is enforced

## Technologies

- **Webpack 5**: Module bundler with Module Federation
- **React 18**: UI library
- **TypeScript 5**: Type-safe JavaScript
- **ts-loader**: TypeScript loader for Webpack
- **style-loader & css-loader**: CSS processing

## Notes

- The entry point uses dynamic import (`import('./bootstrap')`) to ensure Module Federation loads remote dependencies before the application starts
- Dev server runs on port 3000 by default
- CORS is enabled for cross-origin requests
- Hot Module Replacement is enabled for fast development

## License

MIT
