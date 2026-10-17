import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack, { type Configuration } from 'webpack';
import type { Configuration as DevServerConfiguration } from 'webpack-dev-server';

const { ModuleFederationPlugin } = webpack.container;

interface WebpackConfiguration extends Configuration {
  devServer?: DevServerConfiguration;
}

// Optional: unset, or set to an empty string, means "let the backend decide".
const environment = process.env.MFE_ENVIRONMENT?.trim();

const config: WebpackConfiguration = {
  entry: './src/index',
  mode: 'development',
  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  output: {
    publicPath: 'auto',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        // swc only strips the types; `pnpm type-check` (TypeScript 7, which has no JS
        // API for a loader to call) does the type checking.
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: { syntax: 'typescript', tsx: true },
              transform: { react: { runtime: 'automatic' } },
              target: 'es2020',
            },
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    // Build time configuration of the orchestrator client, read back in src/index.ts.
    // See .env.example.
    new webpack.DefinePlugin({
      'process.env.MFE_BACKEND_URL': JSON.stringify(
        process.env.MFE_BACKEND_URL || 'https://console.mfe-orchestrator.dev/api'
      ),
      'process.env.MFE_PROJECT_ID': JSON.stringify(process.env.MFE_PROJECT_ID || ''),
      // DefinePlugin pastes the text on the right into the bundle verbatim, so both
      // cases are spelled out: a quoted slug when there is one, the bare identifier
      // `undefined` when there is not. Never default this to a slug such as 'DEV':
      // every build that forgets the variable would silently pin itself to that
      // environment instead of letting the backend resolve it from the domain.
      'process.env.MFE_ENVIRONMENT': environment ? JSON.stringify(environment) : 'undefined',
    }),
    new ModuleFederationPlugin({
      name: 'host',
      filename: 'remoteEntry.js',
      remotes: {
        // One entry per microfrontend this host consumes:
        // - the key is the name you import from ("exampleremote/Button");
        // - 'example-remote' is the *slug* of the microfrontend in the orchestrator;
        // - 'exampleremote' is the scope, the remote's own ModuleFederationPlugin
        //   `name`. A remote created by the console from a webpack template is named
        //   after its slug, slashes to underscores and dashes removed.
        // Never write a URL here: the backend decides which version is served, and
        // loadWebpackRemote() resolves it, injects that remoteEntry.js and returns the
        // container. The SDK publishes it on globalThis when configure() runs.
        exampleremote: "promise globalThis.__MFE_ORCHESTRATOR__.loadWebpackRemote('example-remote', 'exampleremote')",
      },
      exposes: {
        // Example: './Button': './src/components/Button',
        // Add components you want to expose from this host
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^19.2.0',
          eager: true,
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^19.2.0',
          eager: true,
        },
      },
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};

export default config;
