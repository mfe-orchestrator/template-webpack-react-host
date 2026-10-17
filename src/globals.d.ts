/**
 * Build time values injected by webpack's DefinePlugin. See webpack.config.js and .env.example.
 *
 * This is not Node's `process`: nothing of it survives the build. DefinePlugin rewrites each
 * `process.env.MFE_*` expression into a literal, so these three keys are all there is, and they
 * only exist where they are written out in full. Destructuring `process.env` does not work.
 *
 * If you ever add `@types/node` to this template, delete this declaration and augment
 * `NodeJS.ProcessEnv` instead, or the two declarations of `process` collide.
 */
declare const process: {
  env: {
    /** Base URL of the console API, including the `/api` suffix. */
    MFE_BACKEND_URL: string;
    /** Id of the project this host belongs to. */
    MFE_PROJECT_ID: string;
    /**
     * Orchestrator environment slug, ex. "DEV". Optional: it is a real `undefined` when
     * MFE_ENVIRONMENT is not set at build time, and the backend then resolves the environment
     * from the domain the page is served on.
     */
    MFE_ENVIRONMENT?: string;
  };
};

/**
 * Remotes are resolved at runtime, so the compiler cannot see their types.
 * Add one line per remote module you import, ex.:
 *
 * declare module 'exampleremote/Button';
 */

/** Stylesheets are bundled by css-loader and style-loader, ex. `import './App.css'`. */
declare module '*.css';
