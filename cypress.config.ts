import { defineConfig } from 'cypress';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

// ── Ensure all test-results directories exist before any run ──
const OUTPUT_DIRS = [
  'test-results/screenshots',
  'test-results/videos',
  'test-results/logs',
  'test-results/reports',
  'test-results/artifacts/network',
  'test-results/artifacts/console',
  'test-results/artifacts/data',
  'test-results/artifacts/meta',
];
OUTPUT_DIRS.forEach(d => fs.mkdirSync(path.resolve(__dirname, d), { recursive: true }));

// ── Single log file per execution (appended by cy.task('log')) ──
const runLabel = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const logFile  = path.resolve(__dirname, `test-results/logs/run-${runLabel}.log`);

export default defineConfig({
  // ── Mochawesome reporter (HTML + JSON summary) ────────────────
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir:           'test-results/reports',
    charts:              true,
    reportPageTitle:     'Cypress Test Report',
    embeddedScreenshots: true,
    inlineAssets:        true,
    saveAllAttempts:     false,
    overwrite:           false,
    video:               false,
    json:                true,
  },

  e2e: {
    baseUrl:     process.env.BASE_URL,
    specPattern: 'features/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',

    defaultCommandTimeout: 15000,
    pageLoadTimeout:       30000,

    // Screenshots — failures only
    screenshotOnRunFailure: true,
    screenshotsFolder:      'test-results/screenshots',

    // Videos — failures only
    // Cypress has no per-test toggle; video must be globally on.
    // Passing-spec videos are deleted automatically in after:spec below.
    video:        true,
    videosFolder: 'test-results/videos',

    retries: {
      runMode: process.env.CI ? 2 : 1,
      openMode: 0,
    },
    chromeWebSecurity: false,

    env: {
      ADMIN_USERNAME: process.env.ADMIN_USERNAME,
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    },

    setupNodeEvents(on, config) {
      // ── Mochawesome plugin ──────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('cypress-mochawesome-reporter/plugin')(on);

      // ── Webpack preprocessor (TypeScript + path aliases) ───
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const webpackPreprocessor = require('@cypress/webpack-preprocessor');
      on('file:preprocessor', webpackPreprocessor({
        webpackOptions: {
          resolve: {
            extensions: ['.ts', '.js'],
            alias: {
              '@pages':  path.resolve(__dirname, 'src/gui/pages'),
              '@panels': path.resolve(__dirname, 'src/gui/panels'),
              '@config': path.resolve(__dirname, 'src/config'),
              '@gui':    path.resolve(__dirname, 'src/gui'),
              '@src':    path.resolve(__dirname, 'src'),
              '@data':   path.resolve(__dirname, 'src/config/data'),
            },
          },
          module: {
            rules: [
              {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [{ loader: 'ts-loader', options: { transpileOnly: true } }],
              },
            ],
          },
        },
      }));

      // ── Tasks ───────────────────────────────────────────────
      on('task', {
        // Log to terminal stdout AND append to run log file
        log(message: string) {
          process.stdout.write(message + '\n');
          fs.appendFileSync(logFile, message + '\n');
          return null;
        },

        // Read a JSON file from Node context (used by DataLoader)
        readJsonFile(filePath: string) {
          const fullPath = path.resolve(__dirname, filePath);
          if (!fs.existsSync(fullPath)) throw new Error(`File not found: ${fullPath}`);
          return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        },

        // Save an artifact to test-results/artifacts/<folder>/<filename>
        // Usage: cy.task('saveArtifact', { folder: 'network', filename: 'xhr.json', content: '...' })
        saveArtifact({ folder, filename, content }: { folder: string; filename: string; content: string }) {
          const dir = path.resolve(__dirname, `test-results/artifacts/${folder}`);
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, filename), content);
          return null;
        },
      });

      // ── After each spec: delete passing video/screenshots + write meta ─
      on('after:spec', (spec, results) => {
        const hasFailed = results.stats.failures > 0;

        // Videos: keep failures only
        // Cypress may create both the original .mp4 and a -compressed.mp4 copy.
        // Delete ALL video files for this spec when it passes.
        if (!hasFailed) {
          const videosDir = path.resolve(__dirname, 'test-results/videos');
          const specBase  = path.basename(spec.relative, '.ts');  // e.g. "login.cy"
          try {
            const files = fs.readdirSync(videosDir);
            for (const file of files) {
              if (file.startsWith(specBase)) {
                fs.rmSync(path.join(videosDir, file), { force: true });
              }
            }
          } catch { /* dir missing or empty */ }
        }

        // Screenshots: keep failures only — delete screenshots from passing specs
        if (!hasFailed && results.screenshots?.length) {
          for (const shot of results.screenshots) {
            try { fs.rmSync(shot.path, { force: true }); } catch { /* already gone */ }
          }
        }

        // Meta artifact: one JSON per spec
        const specName = path.basename(spec.relative, '.cy.ts');
        const meta = {
          spec:      spec.relative,
          startedAt: results.stats.startedAt,
          endedAt:   results.stats.endedAt,
          duration:  results.stats.duration,
          tests:     results.stats.tests,
          passes:    results.stats.passes,
          failures:  results.stats.failures,
          pending:   results.stats.pending,
          skipped:   results.stats.skipped,
        };
        fs.writeFileSync(
          path.resolve(__dirname, `test-results/artifacts/meta/${specName}.json`),
          JSON.stringify(meta, null, 2),
        );
      });

      // ── After full run: merge per-spec JSONs into consolidated report ──
      on('after:run', () => {
        const jsonsDir = path.resolve(__dirname, 'test-results/reports/.jsons');
        if (!fs.existsSync(jsonsDir)) return;

        // Read all per-spec mochawesome JSON files
        const jsonFiles = fs.readdirSync(jsonsDir)
          .filter(f => f.endsWith('.json'));

        const merged: unknown[] = [];
        for (const file of jsonFiles) {
          try {
            merged.push(JSON.parse(fs.readFileSync(path.join(jsonsDir, file), 'utf-8')));
          } catch { /* skip malformed */ }
        }

        // Write consolidated JSON at test-results root (sibling of reports/)
        fs.writeFileSync(
          path.resolve(__dirname, 'test-results/results.json'),
          JSON.stringify({
            generatedAt: new Date().toISOString(),
            totalSpecs:  merged.length,
            specs:       merged,
          }, null, 2),
        );

        // Remove the per-spec .jsons dir — no longer needed
        fs.rmSync(jsonsDir, { recursive: true, force: true });
      });

      return config;
    },
  },
});
