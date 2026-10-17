# Webpack React TypeScript Module Federation Host

A starter template for a Module Federation host application built with Webpack 5, React 19, and TypeScript.

## Features

- Webpack 5 with Module Federation
- React 19 with TypeScript
- The [MFE Orchestrator](https://github.com/mfe-orchestrator) client SDK, wired as a **host**
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
│   ├── globals.d.ts        # types of the injected build time variables
│   └── index.ts            # Entry point: configure() lives here
├── .env.example
├── package.json
├── tsconfig.json
├── webpack.config.ts
└── README.md
```

## Getting Started

### Installation

Node.js 22.18 or later: webpack-cli loads `webpack.config.ts` through Node's built-in type
stripping, so there is no ts-node.

```bash
pnpm install
```

### Development

Start the development server:

```bash
pnpm start
```

The application will open at [http://localhost:3000](http://localhost:3000)

Alternative commands:
```bash
pnpm dev        # Start dev server without auto-opening browser
```

### Build

Create a production build:

```bash
pnpm build
```

### Type Checking

Run TypeScript type checking:

```bash
pnpm type-check
```

## How the orchestrator is wired in

**The host never decides which version it gets.** It hands over the identities it holds and uses
the URL it receives, verbatim. Which version that URL points at — stable, canary, whatever — is
decided by the backend. Nothing in this repo parses a version, builds a URL by hand, or knows that
canaries exist.

Two pieces make that work.

**1. `configure()`, at the very top of the entry point (`src/index.ts`), synchronously, before
anything imports a remote:**

```ts
import { configure } from '@mfe-orchestrator-hub/client';

const environment = process.env.MFE_ENVIRONMENT;

configure({
  backendUrl: process.env.MFE_BACKEND_URL,
  projectId: process.env.MFE_PROJECT_ID,
  ...(environment ? { environment } : {}),
});

import('./bootstrap');
```

It goes in `src/index.ts`, not in `src/bootstrap.tsx`. `src/index.ts` is the synchronous entry
chunk; `import('./bootstrap')` is what pulls in the app and, with it, anything that touches a
remote. Move `configure()` into `bootstrap.tsx` and it would sit *after* that module's own imports
have been evaluated, so a remote could be resolved before the SDK knows where the backend is.

`environment` is optional — see [Environment variables](#environment-variables).

**2. The remote, declared in `webpack.config.ts` as a promise that resolves to the remote's container:**

```javascript
remotes: {
  // key: what you import from; 'example-remote': the slug in the orchestrator;
  // 'exampleremote': the scope, the remote's own ModuleFederationPlugin name
  exampleremote: "promise globalThis.__MFE_ORCHESTRATOR__.loadWebpackRemote('example-remote', 'exampleremote')",
}
```

- **The key** (`exampleremote`) is the name you import from: `import('exampleremote/Button')`.
- **The slug** (`'example-remote'`) is the microfrontend in the orchestrator. `loadWebpackRemote()`
  asks the backend for the URL it resolved for that slug, already pinned to a version, injects that
  `remoteEntry.js` once and returns the container. Never write a URL there by hand.
- **The scope** (`'exampleremote'`) is the `name` the remote gives its own `ModuleFederationPlugin`,
  which is how webpack finds the container once the script has run. A remote created by the console
  from a webpack template is named after its slug, slashes to underscores and dashes removed
  (`checkout-new` → `checkoutnew`), the same name the console writes in the configs it generates.
  Left out, it is the `nameToIntegrate` the manifest gives for the slug, which is that same name.

`loadWebpackRemote` is a global because ModuleFederationPlugin pastes a `promise` remote into the
bundle verbatim: it cannot import a package. `configure()` publishes it on
`globalThis.__MFE_ORCHESTRATOR__`, which is one more reason it runs first.

Rename the key, the slug and the scope to match your own microfrontends, and add one entry per
remote. Remotes are invisible to the compiler, so declare each module you import in
`src/globals.d.ts`:

```ts
declare module 'exampleremote/Button' {
  import type { FC, ReactNode } from 'react';

  const Button: FC<{ onClick?: () => void; children?: ReactNode }>;
  export default Button;
}
```

Then use it in your code. `src/App.tsx` loads it lazily, behind an error boundary so the host still
renders when the remote is not available:

```typescript
const RemoteButton = lazy(() => import('exampleremote/Button'));
```

The SDK also exposes `manifest()`, `globalVariables()` and `identities()`, so you can see what the
environment actually returned.

## Environment variables

Read from the shell at build time and injected by webpack's `DefinePlugin`. See `.env.example`.

| variable | required | what it is |
| --- | --- | --- |
| `MFE_BACKEND_URL` | no | orchestrator backend, including the `/api` suffix. Defaults to `https://console.mfe-orchestrator.dev/api` |
| `MFE_PROJECT_ID` | yes | id of your project in the orchestrator |
| `MFE_ENVIRONMENT` | no | environment slug, ex. `DEV`. Omit it, or leave it empty, and the backend resolves the environment from the domain the request comes from |

```bash
MFE_PROJECT_ID=abc123 MFE_ENVIRONMENT=DEV pnpm build   # pinned environment
MFE_PROJECT_ID=abc123 pnpm build                       # resolved by domain
```

### The environment is optional

The host does not have to know which environment it runs in: when the `environment` key is absent
the backend resolves it from the domain the page is served on, matching it against the domains
declared for each environment in the console. One build artifact can therefore be promoted across
DEV, STAGE and PROD unchanged.

With webpack it takes two steps. `webpack.config.ts` substitutes the bare identifier `undefined`
for `process.env.MFE_ENVIRONMENT` when the variable is unset, empty, or only whitespace — **there
is deliberately no `|| 'DEV'` fallback**, which would silently pin every build that forgot the
variable to that one environment — and `src/index.ts` then drops the key instead of forwarding a
fake slug. `configure()` must never receive an empty string or the string `"undefined"`: the SDK
would take either for a real slug and ask for an environment that does not exist.

Set `MFE_ENVIRONMENT` only when you want to pin the environment explicitly — for instance when
several environments are served from the same domain.

`.env` is gitignored. Never commit real values.

## Module Federation Configuration

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
- **React 19**: UI library
- **TypeScript 7**: Type-safe JavaScript. It only type checks (`pnpm type-check`): TypeScript 7 has
  no JS API for a webpack loader to call
- **swc-loader**: strips the types and compiles the JSX for Webpack
- **style-loader & css-loader**: CSS processing
- **@mfe-orchestrator-hub/client**: orchestrator client SDK. The range is `^0.3.0`, and a caret on a
  `0.x` version is deliberately narrow: it accepts `0.3.x` only, **not** `0.4.0`. The SDK is new and
  parts of its API are still settling, so you have to widen this range yourself when it moves on.
  `0.3.0` is the first version with `loadWebpackRemote()`, which the remote declaration above needs.
  `configure()` throws with an explanation when `backendUrl` or `projectId` is missing, empty or
  still a placeholder, so a build without `MFE_PROJECT_ID` fails on load instead of asking the
  backend for nothing

## Notes

- `configure()` runs in `src/index.ts`, before the `import('./bootstrap')` that starts the app. Keep that order: it publishes the `loadWebpackRemote()` the remote declarations call, and a remote must not be resolved before the SDK knows where the backend is
- The entry point uses dynamic import (`import('./bootstrap')`) to ensure Module Federation loads remote dependencies before the application starts
- `output.publicPath` stays `'auto'`. A classic script derives the base of its chunks from `document.currentScript.src`, which is the URL *before* any redirect, so this is what keeps a version pinned entry loading its own chunks instead of mixing two builds in one page
- Dev server runs on port 3000 by default
- CORS is enabled for cross-origin requests
- Hot Module Replacement is enabled for fast development

## License

MIT
