# Webpack React TypeScript Module Federation Host

A starter template for a Module Federation host application built with Webpack 5, React 18, and TypeScript.

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

> [!IMPORTANT]
> With `@mfe-orchestrator-hub/client@0.1.0` both `type-check` and `build` currently fail with a
> single error on the `configure()` call in `src/index.ts`:
>
> ```
> TS2345: Argument of type '{ environment?: string | undefined; ... }' is not assignable to
> parameter of type 'OrchestratorConfig'.
> ```
>
> The published typings still declare `environment` as required, while it is optional in practice
> and this template omits the key on purpose. It clears itself with the next SDK release, which
> types it as `environment?: string`. Do not paper over it with `any` or `@ts-ignore`: the emitted
> JavaScript is already correct.

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

**2. The remote, declared in `webpack.config.js` as a promise that resolves to a URL:**

```javascript
remotes: {
  exampleremote: `promise import('@mfe-orchestrator-hub/client').then(m => m.remoteUrl('example-remote'))`,
}
```

`remoteUrl('example-remote')` takes the **slug** of a microfrontend in the orchestrator and returns
the URL the backend resolved for it, already pinned to a version. Rename the key and the slug to
match your own microfrontends, and add one entry per remote. Never write a URL there by hand.

Remotes are invisible to the compiler, so declare each module you import in `src/globals.d.ts`:

```ts
declare module 'exampleremote/Button';
```

Then import and use remote components in your code:

```typescript
import RemoteComponent from 'exampleremote/Button';
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

With webpack it takes two steps. `webpack.config.js` substitutes the bare identifier `undefined`
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
- **TypeScript 5**: Type-safe JavaScript
- **ts-loader**: TypeScript loader for Webpack
- **style-loader & css-loader**: CSS processing
- **@mfe-orchestrator-hub/client**: orchestrator client SDK. The range is `^0.1.0`, and a caret on a
  `0.x` version is deliberately narrow: it accepts `0.1.x` only, **not** `0.2.0`. The SDK is new and
  parts of its API are still settling, so you have to widen this range yourself when it moves on

## Notes

- `configure()` runs in `src/index.ts`, before the `import('./bootstrap')` that starts the app. Keep that order: the federation runtime imports the SDK to resolve a remote and expects it already configured
- The entry point uses dynamic import (`import('./bootstrap')`) to ensure Module Federation loads remote dependencies before the application starts
- `output.publicPath` stays `'auto'`. A classic script derives the base of its chunks from `document.currentScript.src`, which is the URL *before* any redirect, so this is what keeps a version pinned entry loading its own chunks instead of mixing two builds in one page
- Dev server runs on port 3000 by default
- CORS is enabled for cross-origin requests
- Hot Module Replacement is enabled for fast development

## License

MIT
