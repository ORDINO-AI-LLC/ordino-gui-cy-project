# ordino-gui-cy-project

Cypress UI test automation — TypeScript, Page Object Model, fluent chaining, artifact collection.

---

## Project Structure

```
ordino-gui-cy-project/
├── .env                                    # Environment variables (BASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD)
├── cypress.config.ts                       # Cypress configuration
├── tsconfig.json                           # TypeScript compiler options + path aliases
├── package.json
├── CYPRESS-SKILL.md                        # AI agent + contributor reference guide
│
├── cypress/
│   └── support/
│       ├── commands.ts                     # Custom commands (adminLogin, stepFlush, stepClear)
│       └── e2e.ts                          # Global hooks, plugin registration, artifact capture
│
├── src/
│   ├── config/
│   │   ├── page-loader.ts                  # Barrel re-export for pages, panels, loaders, interfaces, logger
│   │   ├── data/
│   │   │   ├── interfaces/
│   │   │   │   ├── index.ts
│   │   │   │   ├── common.interfaces.ts    # DataSet<T> generic type
│   │   │   │   ├── login.interfaces.ts     # LoginCredentials, LoginUsersFile, LoginExpectedFile
│   │   │   │   └── dashboard.interfaces.ts # DashboardExpectedFile
│   │   │   └── loaders/
│   │   │       ├── index.ts
│   │   │       ├── DataLoader.ts           # Generic JSON loader with in-memory cache
│   │   │       └── CredentialResolver.ts   # Resolves credentials from JSON + env override
│   │   └── utils/
│   │       └── logger.ts                   # Log utilities + step wrapper (cy.task-backed)
│   │
│   ├── data/
│   │   ├── login/
│   │   │   ├── users.json                  # User credentials (admin, invalid)
│   │   │   └── expected.json               # Expected values for login assertions
│   │   └── dashboard/
│   │       └── expected.json               # Expected values for dashboard assertions
│   │
│   └── gui/
│       ├── pages/
│       │   ├── BasePage.ts                 # Shared utilities (waitForPageLoad, waitForElement, attachScreenshot)
│       │   ├── LoginPage.ts                # Login page actions and verifications
│       │   └── DashboardPage.ts            # Dashboard page verifications (composes HeaderPanel)
│       └── panels/
│           └── HeaderPanel.ts              # Reusable header/profile panel
│
└── features/
    ├── login.cy.ts                         # Login suite (2 tests)
    └── home.cy.ts                          # Dashboard suite — authenticated session (1 test)
```

---

## Installation

```bash
npm install
```

## Environment Setup

Create a `.env` file in the project root:

```bash
BASE_URL=https://opensource-demo.orangehrmlive.com
ADMIN_USERNAME=Admin
ADMIN_PASSWORD=admin123
```

All values default to the OrangeHRM demo instance if not set.

---

## Running Tests

| Command | Description |
|---|---|
| `npm run ui:headless` | Run all tests headlessly (CI-friendly) |
| `npm run ui:headed` | Run with visible browser |
| `npm run ui:open` | Open Cypress Test Runner for interactive debugging |
| `npm run clean` | Delete `test-results/` |
| `npm run audit` | TypeScript type-check without emitting files |

---

## Key Design Decisions

### Page Object Model (POM)

Each page/panel is a class extending `BasePage`. No constructor — Cypress provides `cy` globally. Methods follow a strict naming convention:

- `step_*` — actions (navigate, fill, click)
- `verify_*` — assertions

All methods return `this` or a new page object for fluent chaining. `cy.step()` is called at the start of each method for step visibility in the command log and videos.

### Fluent Chaining — Cross-Page Navigation

Action methods that navigate to a new page return that page object, enabling a single unbroken chain across page transitions:

```ts
new LoginPage()
  .step_navigate()
  .step_login(CredentialResolver.getUser('admin'))   // returns DashboardPage
  .verify_onDashboard()
  .verify_profileName();
```

When an action is expected to fail and stay on the same page, use the `ExpectError` variant:

```ts
new LoginPage()
  .step_navigate()
  .step_loginExpectError(CredentialResolver.getUser('invalid'))  // returns LoginPage
  .verify_errorMessage(expected.errors.invalidCredentials);
```

### Reusable Panels

Shared UI sections (e.g. `HeaderPanel`) live in `src/gui/panels/` and are composed into page classes, not extended:

```ts
export class DashboardPage extends BasePage {
  readonly topNav = new HeaderPanel();
}
```

### Session Management

`cy.adminLogin()` (registered in `commands.ts`) uses `cy.session()` to cache the admin authenticated session across tests. The session is only re-established if cookies are absent — eliminating repeated logins.

Tests that explicitly test the login flow clear auth state in `beforeEach`:

```ts
beforeEach(() => {
  cy.clearCookies();
  cy.clearLocalStorage();
});
```

Tests that need a pre-authenticated session call `cy.adminLogin()` in `beforeEach`:

```ts
beforeEach(() => {
  cy.adminLogin();
});
```

### Test Data

JSON files in `src/data/` hold credentials and expected values. `DataLoader` reads and caches them at bundle time; `CredentialResolver` resolves user credentials with optional `Cypress.env()` overrides for CI/CD:

```ts
const expected = DataLoader.load<LoginExpectedFile>('login/expected');
const credentials = CredentialResolver.getUser('admin');
```

### Artifact Collection

Every test automatically captures and saves three artifact types via `afterEach` in `e2e.ts`:

| Artifact | Contents | Location |
|---|---|---|
| Network | All XHR/fetch requests (method, URL, status, duration) | `test-results/artifacts/network/` |
| Console | All console output (level, message, timestamp) | `test-results/artifacts/console/` |
| Data | Test context snapshot (URL, env, browser, viewport) | `test-results/artifacts/data/` |
| Meta | Per-spec stats (pass/fail counts, timing) | `test-results/artifacts/meta/` |

Screenshots and videos are captured for **failures only** — passing spec files are auto-deleted in the `after:spec` hook.

### Reporter

`cypress-mochawesome-reporter` generates an HTML report with embedded screenshots after each run:

| Output | Location |
|---|---|
| HTML report | `test-results/reports/index.html` |
| Consolidated JSON | `test-results/reports/results.json` |
| Per-run log | `test-results/logs/run-{timestamp}.log` |
| Screenshots | `test-results/screenshots/` |
| Videos | `test-results/videos/` |

---

## Custom Commands

| Command | Signature | Purpose |
|---|---|---|
| `cy.adminLogin()` | `(): Chainable<void>` | Cached admin login via `cy.session()` |
| `cy.stepFlush()` | `(): Chainable<void>` | Emit buffered steps to terminal with ✔/✖ status |
| `cy.stepClear()` | `(): Chainable<void>` | Reset step buffer |

---

## Dependencies

| Package | Purpose |
|---|---|
| `cypress` | Test runner, browser automation, assertions |
| `cypress-mochawesome-reporter` | HTML + JSON report generation |
| `cypress-plugin-steps` | Step numbering in command log and videos |
| `@cypress/webpack-preprocessor` | TypeScript + path alias support via webpack |
| `ts-loader` | TypeScript loader for webpack |
| `webpack` | Module bundler (required by preprocessor) |
| `dotenv` | Load `.env` into `process.env` |
| `typescript` | Type-safe JavaScript |
| `@types/node` | Node.js type definitions |
