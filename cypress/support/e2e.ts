import 'cypress-plugin-steps';
import 'cypress-mochawesome-reporter/register';
import './commands';

// Disable uncaught exception handling to prevent test failures from app errors
Cypress.on('uncaught:exception', () => false);

// ── Artifact collection: network, console, data ──────────────────────────────
// All three buffers live in the support file (compiled once — guaranteed singleton).
// They are populated automatically and flushed to test-results/artifacts/ in afterEach.

interface NetworkEntry {
  method: string;
  url: string;
  statusCode: number | null;
  duration: number;
  timestamp: string;
}

interface ConsoleEntry {
  level: string;
  message: string;
  timestamp: string;
}

let __networkBuffer: NetworkEntry[] = [];
let __consoleBuffer: ConsoleEntry[] = [];

// ── Network capture via cy.intercept ─────────────────────────────────────────
// Intercepts all requests, records method/url/status/duration per request.
// Skips Cypress internal routes (/__cypress/, /__socket/).
beforeEach(() => {
  __networkBuffer = [];

  cy.intercept({ url: /^(?!.*\/__cypress|.*\/__socket).*$/ }, (req) => {
    const start = Date.now();
    const entry: NetworkEntry = {
      method:     req.method,
      url:        req.url,
      statusCode: null,
      duration:   0,
      timestamp:  new Date().toISOString(),
    };
    req.continue((res) => {
      entry.statusCode = res.statusCode;
      entry.duration   = Date.now() - start;
      __networkBuffer.push(entry);
    });
  });
});

// ── Console capture via window monkey-patch ──────────────────────────────────
// Patches console.log/warn/error/info on every window load (including cy.visit).
Cypress.on('window:before:load', (win) => {
  const methods = ['log', 'warn', 'error', 'info'] as const;
  methods.forEach((method) => {
    const original = win.console[method].bind(win.console);
    win.console[method] = (...args: unknown[]) => {
      __consoleBuffer.push({
        level:     method,
        message:   args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '),
        timestamp: new Date().toISOString(),
      });
      original(...args);
    };
  });
});

// ── Flush all artifacts after each test ──────────────────────────────────────
afterEach(function () {
  const title    = (this.currentTest as Mocha.Test)?.fullTitle() || 'unknown';
  const safeName = title.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');

  // Network artifact
  if (__networkBuffer.length > 0) {
    cy.task('saveArtifact', {
      folder:   'network',
      filename: `${safeName}.json`,
      content:  JSON.stringify(__networkBuffer, null, 2),
    });
  }

  // Console artifact
  if (__consoleBuffer.length > 0) {
    cy.task('saveArtifact', {
      folder:   'console',
      filename: `${safeName}.json`,
      content:  JSON.stringify(__consoleBuffer, null, 2),
    });
  }

  // Data artifact — test context snapshot (env config, test state)
  const testState = (this.currentTest as Mocha.Test)?.state || 'unknown';
  cy.task('saveArtifact', {
    folder:   'data',
    filename: `${safeName}.json`,
    content:  JSON.stringify({
      test:      title,
      state:     testState,
      baseUrl:   Cypress.config('baseUrl'),
      env: {
        ADMIN_USERNAME: Cypress.env('ADMIN_USERNAME') || null,
      },
      browser: {
        name:    Cypress.browser.name,
        version: Cypress.browser.version,
      },
      viewport: {
        width:  Cypress.config('viewportWidth'),
        height: Cypress.config('viewportHeight'),
      },
      timestamp: new Date().toISOString(),
    }, null, 2),
  });

  // Clear buffers for next test
  __networkBuffer = [];
  __consoleBuffer = [];
});
