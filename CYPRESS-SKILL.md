# Cypress Boilerplate Agent Skill

**Version:** 2.2
**Last Updated:** March 26, 2026
**Scope:** Test generation, code review, and project scaffolding for Cypress QA automation

---

## Executive Summary

This skill file ensures AI coding agents (Claude, GitHub Copilot, Cursor) and new team members generate Cypress tests that strictly adhere to this project's architecture, conventions, and best practices.

**Key Principle:** The boilerplate is the single source of truth. All new code must mirror its structure, conventions, and patterns exactly.

**Who this is for:**
- AI agents generating or reviewing test code
- New team members writing their first tests
- PR reviewers checking test quality

---

## 1. Project Architecture & File Structure

### 1.1 Directory Hierarchy

```
project-root/
├── .env                              # Configuration (BASE_URL, credentials) — tracked in git
├── .gitignore                        # Excludes node_modules, screenshots, videos
├── cypress.config.ts                 # Cypress configuration (dotenv loaded here)
├── tsconfig.json                     # TypeScript compiler with path aliases
├── package.json                      # Scripts, dependencies (Cypress, TS, dotenv, webpack)
├── CYPRESS-SKILL.md                  # This file — AI agent & team guidelines
│
├── src/
│   ├── config/
│   │   ├── page-loader.ts            # Barrel export registry for all page objects & panels
│   │   ├── data/                     # Test data source code (interfaces + loaders)
│   │   │   ├── interfaces/           # TypeScript shape definitions (type safety)
│   │   │   │   ├── common.interfaces.ts  # DataSet<T> generic type
│   │   │   │   ├── login.interfaces.ts   # LoginCredentials, LoginUsersFile, LoginExpectedFile
│   │   │   │   ├── dashboard.interfaces.ts # DashboardExpectedFile
│   │   │   │   └── index.ts              # Barrel export
│   │   │   └── loaders/              # Data access layer
│   │   │       ├── DataLoader.ts     # Generic JSON reader with cache (uses require())
│   │   │       ├── CredentialResolver.ts # User credential resolver (JSON + Cypress.env() override)
│   │   │       └── index.ts          # Barrel export
│   │   └── utils/
│   │       └── logger.ts             # Logging utilities (logSuite, logTest, logField, etc.) — step logging via cypress-plugin-steps
│   │
│   ├── data/                         # TESTER-EDITABLE — JSON only, no TypeScript
│   │   ├── login/
│   │   │   ├── users.json            # Test user credentials (admin, invalid, etc.)
│   │   │   └── expected.json         # Expected UI text (error messages, labels)
│   │   └── dashboard/
│   │       └── expected.json         # Expected titles, labels
│   │
│   └── gui/
│       ├── pages/
│       │   ├── BasePage.ts           # Base class — all pages extend this
│       │   ├── LoginPage.ts          # Login workflow page object
│       │   ├── DashboardPage.ts      # Dashboard page object (composes HeaderPanel)
│       │   └── [NewPage].ts          # Additional pages follow same pattern
│       │
│       └── panels/
│           ├── HeaderPanel.ts        # Reusable header/profile dropdown component
│           └── [NewPanel].ts         # Additional reusable UI components
│
├── features/
│   ├── login.cy.ts                   # Login test scenarios (clears auth state)
│   ├── home.cy.ts                    # Dashboard test scenarios (uses cy.adminLogin)
│   └── [feature].cy.ts              # Additional feature tests
│
├── cypress/
│   └── support/
│       ├── e2e.ts                    # Global hooks, imports commands
│       └── commands.ts               # Custom commands (cy.adminLogin with cy.session)
│
└── test-results/                     # All run outputs — git-ignored, cleaned by npm run clean
    ├── screenshots/                  # Failure screenshots only (Cypress auto-captures)
    ├── videos/                       # Failure videos only (passing videos deleted in after:spec)
    ├── logs/                         # run-<timestamp>.log — terminal output per execution
    ├── reports/                      # Mochawesome HTML + JSON summary (index.html)
    └── artifacts/
        ├── meta/                     # Per-spec JSON: timing, pass/fail counts (auto-written)
        ├── network/                  # XHR/fetch logs (written via cy.task('saveArtifact'))
        ├── console/                  # Browser console output (written via cy.task('saveArtifact'))
        └── data/                     # Test data snapshots (written via cy.task('saveArtifact'))
```

### 1.2 Non-Negotiable Architecture Rules

| # | Rule | Rationale |
|---|------|-----------|
| 1 | **All pages extend `BasePage`** | Consistency, shared utilities (`waitForPageLoad`, `getTitle`, `attachScreenshot`) |
| 2 | **Single responsibility** | One page object = one application page. One panel = one reusable UI section. No DOM logic in test files. |
| 3 | **Page objects instantiated in tests** | Tests create `new PageObject()` directly. No constructor parameters needed (Cypress provides `cy` globally). |
| 4 | **Configuration from `.env` only** | No hardcoded URLs, credentials, or fallback defaults in code. Use `Cypress.env('VAR')` for env access. |
| 5 | **Page loader as single import source** | All page/panel imports go through `page-loader.ts`. No direct path imports in tests. |
| 6 | **Tests in `features/` only** | Test directory pattern is `features/**/*.cy.ts`. Never `tests/`, `specs/`, or `__tests__/`. |

---

## 2. NPM Scripts Reference

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run ui:headed` | `cypress run --browser chrome --headed` | Run with visible browser |
| `npm run ui:headless` | `cypress run --browser chrome --headless` | Headless execution (CI-friendly) |
| `npm run ui:open` | `cypress open` | Open Cypress Test Runner for interactive debugging |
| `npm run clean` | _(node script)_ | Delete entire `test-results/` directory |
| `npm run audit` | `tsc --noEmit` | TypeScript type-checking only (no output files) |

---

## 3. Path Aliases (tsconfig.json)

All path aliases available in the project:

| Alias | Maps To | Usage |
|-------|---------|-------|
| `@pages/*` | `src/gui/pages/*` | Page object imports within `src/` |
| `@panels/*` | `src/gui/panels/*` | Panel/component imports within `src/` |
| `@gui/*` | `src/gui/*` | Any GUI layer import |
| `@config/*` | `src/config/*` | Config, utilities |
| `@src/*` | `src/*` | Top-level src imports |
| `@data/*` | `src/config/data/*` | Test data interfaces & loaders |

Path aliases are resolved by `@cypress/webpack-preprocessor` configured in `cypress.config.ts`.

### Import Rules

**Inside `src/` files** — use path aliases:
```typescript
// Page objects importing from other layers
import { LoginCredentials } from '@data/interfaces';
import { HeaderPanel } from '@gui/panels/HeaderPanel';
```

**Inside `features/*.cy.ts` files** — one import source, always a single line:
```typescript
// Everything from page-loader (single source, single line)
import { LoginPage, DashboardPage, CredentialResolver, DataLoader, LoginExpectedFile, logSuite, logTest } from '../src/config/page-loader';
```

**Rule: Tests have exactly one import source:**
- `../src/config/page-loader` — all page objects, panels, data loaders, interfaces, and logging utilities

**Never import directly from:**
- `../src/config/data/loaders` ❌
- `../src/config/data/interfaces` ❌
- `../src/config/utils/logger` ❌
- `../src/gui/pages/[PageName]` ❌

**Why:** `page-loader.ts` is the single registry. All imports funnel through it, keeping test files clean and consistent.

---

## 4. Page Object Design

### 4.1 BasePage (Immutable Base Class)

**File:** `src/gui/pages/BasePage.ts` — **Do not modify** unless adding generic cross-page utilities.

```typescript
export class BasePage {
  waitForPageLoad(): this {
    cy.document().its('readyState').should('eq', 'complete');
    return this;
  }

  waitForElement(selector: string, timeout = 10000): this {
    cy.get(selector, { timeout }).should('be.visible');
    return this;
  }

  getTitle(): Cypress.Chainable<string> {
    return cy.title();
  }

  attachScreenshot(name = 'screenshot'): this {
    cy.screenshot(name, { capture: 'fullPage' });
    return this;
  }
}
```

**Key difference from Playwright:** No constructor parameter. Cypress provides `cy` globally, so page objects don't need a `Page` instance injected.

### 4.2 Page Object Template

Every new page object must follow this exact structure:

```typescript
import { BasePage } from './BasePage';

export class [PageName] extends BasePage {
  // ── Page Path ────────────────────────────────────────
  readonly path = '/path/to/page';

  // ── Locators (always private, string selectors) ─────
  private someInput    = 'input[name="field"]';
  private submitButton = 'button[type="submit"]';
  private errorMessage = '.error-selector';

  // ── Actions (step_* prefix) ──────────────────────────
  // Return this   → action stays on the same page
  // Return NextPage → action navigates to a new page (enables cross-page fluent chain)
  step_navigate(): this {
    cy.step('step_navigate');
    cy.visit(this.path);
    this.waitForPageLoad();
    return this;
  }

  step_fillAndSubmit(data: SomeType): NextPage {
    cy.step('step_fillAndSubmit');
    cy.get(this.someInput).clear().type(data.value);
    cy.get(this.submitButton).click();
    this.waitForPageLoad();
    return new NextPage();
  }

  step_fillAndSubmitExpectError(data: SomeType): this {
    cy.step('step_fillAndSubmitExpectError');
    cy.get(this.someInput).clear().type(data.value);
    cy.get(this.submitButton).click();
    return this;
  }

  // ── Verifications (verify_* prefix) ──────────────────
  verify_onPage(): this {
    cy.step('verify_onPage');
    cy.url().should('include', 'expected-path');
    return this;
  }

  verify_errorMessage(expectedText: string): this {
    cy.step('verify_errorMessage');
    cy.get(this.errorMessage, { timeout: 10000 })
      .should('be.visible')
      .and('contain.text', expectedText);
    return this;
  }
}
```

### 4.3 Naming Conventions

| Element | Convention | Examples |
|---------|-----------|----------|
| Action methods | `step_*` prefix | `step_login()`, `step_navigate()`, `step_fillForm()` |
| Verification methods | `verify_*` prefix | `verify_onDashboard()`, `verify_errorMessage()` |
| Page URL | `readonly path` | `readonly path = '/web/index.php/auth/login'` |
| DOM selectors | `private` string properties | `private usernameInput = 'input[name="username"]'` |
| Return type (same page) | `this` | `step_navigate()`, `verify_*()`, `step_*ExpectError()` |
| Return type (navigates away) | `new TargetPage()` | `step_login()` → returns `new DashboardPage()` |
| Step logging | `cy.step('name')` before commands | Automatic step numbering in Cypress command log |

### 4.4 Real Example — LoginPage.ts

```typescript
import { BasePage } from './BasePage';
import { DashboardPage } from './DashboardPage';
import { LoginCredentials } from '@data/interfaces';

export class LoginPage extends BasePage {
  readonly path = '/web/index.php/auth/login';

  private usernameInput = 'input[name="username"]';
  private passwordInput = 'input[name="password"]';
  private loginButton   = 'button[type="submit"]';
  private errorMsg      = '.oxd-alert-content-text';

  step_navigate(): this {
    cy.step('step_navigate');
    cy.visit(this.path);
    this.waitForPageLoad();
    return this;
  }

  // Navigates to DashboardPage on success — returns DashboardPage for fluent chaining
  step_login(credentials: LoginCredentials): DashboardPage {
    cy.step('step_login');
    cy.get(this.usernameInput).clear().type(credentials.username);
    cy.get(this.passwordInput).clear().type(credentials.password);
    cy.get(this.loginButton).click();
    this.waitForPageLoad();
    return new DashboardPage();
  }

  // Stays on LoginPage on failure — returns this for fluent error verification
  step_loginExpectError(credentials: LoginCredentials): this {
    cy.step('step_loginExpectError');
    cy.get(this.usernameInput).clear().type(credentials.username);
    cy.get(this.passwordInput).clear().type(credentials.password);
    cy.get(this.loginButton).click();
    return this;
  }

  verify_errorMessage(expectedText: string): this {
    cy.step('verify_errorMessage');
    cy.get(this.errorMsg, { timeout: 10000 })
      .should('be.visible')
      .and('contain.text', expectedText);
    return this;
  }
}
```

---

## 5. Panel (Component) Pattern

### 5.1 When to Create a Panel

Create a panel when a UI section:
- Appears on **multiple pages** (header, sidebar, footer)
- Has **complex internal interactions** (dropdowns, menus)
- Should be **independently reusable**

### 5.2 Panel Template

```typescript
export class [PanelName] {
  private someElement = '.selector';

  getSomeValue(): Cypress.Chainable<string> {
    cy.step('getSomeValue');
    return cy.get(this.someElement, { timeout: 10000 })
      .should('be.visible')
      .invoke('text')
      .then(text => text.trim());
  }

  clickSomething(): this {
    cy.step('clickSomething');
    cy.get(this.someElement).click();
    return this;
  }
}
```

**Key differences from Page Objects:**
- Panels do **not** extend `BasePage`
- No import needed for step logging — `cy.step()` is globally available
- Locators are `private` string properties
- ALL public methods call `cy.step('name')` before their commands — including getters
- Panels are composed into page objects, not used directly in tests

### 5.3 Composing Panels into Pages

```typescript
export class DashboardPage extends BasePage {
  readonly topNav = new HeaderPanel();  // Panel as a readonly property

  verify_profileName(): this {
    cy.step('verify_profileName');
    this.topNav.getProfileName()         // Delegate to panel
      .should('not.be.empty');
    return this;
  }
}
```

---

## 6. Test Structure & Conventions

### 6.1 Test File Template — Standard (Login Flow)

Use this pattern when testing flows that start from a known page (login, forms, etc.):

```typescript
import { LoginPage, CredentialResolver, DataLoader, LoginExpectedFile, logSuite, logTest } from '../src/config/page-loader';

const expected = DataLoader.load<LoginExpectedFile>('login/expected');

describe('Feature Name - Scenario Group', () => {
  logSuite('Feature Name - Scenario Group');

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should do something when condition', () => {
    logTest('should do something when condition');

    // step_login returns DashboardPage — chain continues seamlessly
    new LoginPage()
      .step_navigate()
      .step_login(CredentialResolver.getUser('admin'))
      .verify_onDashboard()
      .verify_profileName();
  });

  it('should show error for invalid input', () => {
    logTest('should show error for invalid input');

    // step_loginExpectError returns LoginPage — stays on page to verify error
    new LoginPage()
      .step_navigate()
      .step_loginExpectError(CredentialResolver.getUser('invalid'))
      .verify_errorMessage(expected.errors.invalidCredentials);
  });
});
```

### 6.2 Test File Template — Authenticated Session

Use this pattern when testing pages that require a logged-in user (skip login flow):

```typescript
import { DashboardPage, DataLoader, DashboardExpectedFile, logSuite, logTest } from '../src/config/page-loader';

const expected = DataLoader.load<DashboardExpectedFile>('dashboard/expected');

describe('Feature Name - Authenticated', () => {
  logSuite('Feature Name - Authenticated');

  beforeEach(() => {
    cy.adminLogin();
  });

  it('should display page after authenticated session', () => {
    logTest('should display page after authenticated session');

    new DashboardPage()
      .step_navigate()
      .verify_onDashboard()
      .verify_pageTitle(expected.labels.pageTitle)
      .verify_profileName();
  });
});
```

**When to use which pattern:**

| Pattern | When | Auth State |
|---------|------|------------|
| Standard (clear auth in `beforeEach`) | Testing login flow or starting from login | `cy.clearCookies()` + `cy.clearLocalStorage()` clears auth |
| `cy.adminLogin()` in `beforeEach` | Testing pages behind login (skip login step) | Restores cached session via `cy.session()` |

### 6.3 Test Naming Convention

```
should [expected behavior] when/for [condition/context]
```

Examples:
- `should login successfully and verify profile name on home page`
- `should show error message for invalid credentials`
- `should display dashboard home page with profile visible after authenticated session`

### 6.4 Test Rules

**Rule 1: Import everything from `page-loader.ts`**
```typescript
// CORRECT — single import source
import { LoginPage, CredentialResolver, logSuite, logTest } from '../src/config/page-loader';

// WRONG — scattered imports
import { LoginPage } from '../src/gui/pages/LoginPage';
import { logSuite } from '../src/config/utils/logger';
```

**Rule 2: Use fluent chaining — no intermediate variables**
```typescript
// CORRECT — single unbroken chain across page objects
new LoginPage()
  .step_navigate()
  .step_login(CredentialResolver.getUser('admin'))  // returns DashboardPage
  .verify_onDashboard()
  .verify_profileName();

// WRONG — unnecessary variable, broken chain
const loginPage = new LoginPage();
loginPage.step_navigate();
loginPage.step_login(CredentialResolver.getUser('admin'));
const dashboardPage = new DashboardPage();
dashboardPage.verify_onDashboard();
```

**Cross-page fluency:** action methods that navigate to a new page return that page object.
Use `step_loginExpectError` (returns `LoginPage`) when the action is expected to fail and verification stays on the same page:
```typescript
// Happy path — step_login returns DashboardPage
new LoginPage()
  .step_navigate()
  .step_login(CredentialResolver.getUser('admin'))
  .verify_onDashboard();

// Error path — step_loginExpectError returns LoginPage
new LoginPage()
  .step_navigate()
  .step_loginExpectError(CredentialResolver.getUser('invalid'))
  .verify_errorMessage(expected.errors.invalidCredentials);
```

**Rule 2b: Imports in test files are always a single line**
```typescript
// CORRECT
import { LoginPage, DashboardPage, CredentialResolver, logSuite, logTest } from '../src/config/page-loader';

// WRONG — multi-line imports in test files
import {
  LoginPage, DashboardPage,
  CredentialResolver, logSuite, logTest,
} from '../src/config/page-loader';
```

**Rule 3: Keep tests business-focused — no DOM logic**
```typescript
// CORRECT — high-level, readable
loginPage.step_login(CredentialResolver.getUser('admin'));

// WRONG — DOM selectors in test
cy.get('input[name="username"]').type('Admin');
cy.get('button[type="submit"]').click();
```

**Rule 4: Use test data constants, never hardcoded values**
```typescript
// CORRECT
loginPage.step_login(CredentialResolver.getUser('admin'));

// WRONG
loginPage.step_login({ username: 'Admin', password: 'admin123' });
```

**Rule 5: Always include logging calls**
```typescript
describe('Suite Name', () => {
  logSuite('Suite Name');           // First line of describe block

  it('test name', () => {
    logTest('test name');           // First line of test body
    // ... test steps
  });
});
```

**Rule 6: No async/await — use Cypress command chains**
```typescript
// CORRECT — fluent chain, no async/await
new LoginPage()
  .step_navigate()
  .step_login(CredentialResolver.getUser('admin'));

// WRONG — async/await is not needed in Cypress
await loginPage.step_navigate();
await loginPage.step_login(CredentialResolver.getUser('admin'));
```

---

## 7. Session Management (Authentication)

### 7.1 How It Works

**File:** `cypress/support/commands.ts`

The `cy.adminLogin()` custom command uses `cy.session()` to cache authentication:

```typescript
Cypress.Commands.add('adminLogin', () => {
  cy.session(
    'admin',
    () => {
      cy.visit('/web/index.php/auth/login');
      cy.get('input[name="username"]').type(username);
      cy.get('input[name="password"]').type(password);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', 'dashboard');
    },
    {
      validate() {
        cy.getCookies().should('have.length.greaterThan', 0);
      },
    }
  );
});
```

**How `cy.session()` works:**
1. First call: runs the login setup function, caches cookies + localStorage
2. Subsequent calls: restores cached session instantly (no re-login)
3. Validation: runs `validate()` to check session is still active
4. If validation fails: re-runs the setup function

This replaces Playwright's `global-setup.ts` + `authenticatedPage` fixture pattern.

### 7.2 Credential Flow

```
cy.adminLogin()
  ├─ Reads Cypress.env('ADMIN_USERNAME') + Cypress.env('ADMIN_PASSWORD')
  ├─ Falls back to defaults if not set
  ├─ cy.session() caches the session across tests
  └─ Restores cookies + localStorage on subsequent calls
```

### 7.3 Adding a New Authenticated Role

```typescript
// In cypress/support/commands.ts
Cypress.Commands.add('loginAs', (role: string) => {
  const user = CredentialResolver.getUser(role);
  cy.session(
    role,
    () => {
      cy.visit('/web/index.php/auth/login');
      cy.get('input[name="username"]').type(user.username);
      cy.get('input[name="password"]').type(user.password);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', 'dashboard');
    },
    {
      validate() {
        cy.getCookies().should('have.length.greaterThan', 0);
      },
    }
  );
});
```

---

## 8. Page Loader (Barrel Exports)

### 8.1 Current Registry

**File:** `src/config/page-loader.ts`

```typescript
// ── Page Objects ─────────────────────────────────────────────
export { LoginPage } from '../gui/pages/LoginPage';
export { DashboardPage } from '../gui/pages/DashboardPage';

// ── Panels ───────────────────────────────────────────────────
export { HeaderPanel } from '../gui/panels/HeaderPanel';

// ── Data Loaders ─────────────────────────────────────────────
export { DataLoader } from './data/loaders/DataLoader';
export { CredentialResolver } from './data/loaders/CredentialResolver';

// ── Data Interfaces ──────────────────────────────────────────
export * from './data/interfaces';

// ── Logging ─────────────────────────────────────────────────
export { logSuite, logTest, logField, logUrl, logSep, logSuccess } from './utils/logger';
```

### 8.2 Rules

- **Every new page object must be exported here**
- **Every new panel must be exported here**
- **Every new data interface must be exported here** (via `export * from './data/interfaces'`)
- **Tests import ONLY from `page-loader`**
- Page objects within `src/` use path aliases (`@data/interfaces`, `@config/utils/logger`)

---

## 9. Test Data Management (JSON-Based Model)

### 9.1 Architecture Overview

Test data follows a **three-layer architecture** designed so testers edit JSON while developers maintain type safety:

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: JSON Data Files (tester-editable, no TS needed)   │
│  src/data/login/users.json                                  │
│  src/data/login/expected.json                               │
│  src/data/dashboard/expected.json                           │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Loaders (read JSON, apply overrides, cache)       │
│  src/config/data/loaders/DataLoader.ts                      │
│  src/config/data/loaders/CredentialResolver.ts              │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Interfaces (TypeScript type definitions)          │
│  src/config/data/interfaces/login.interfaces.ts             │
│  src/config/data/interfaces/dashboard.interfaces.ts         │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 JSON Data Files (Tester-Editable)

**`src/data/login/users.json`** — test user credentials:
```json
{
  "_comment": "Test user credentials. Admin can be overridden by .env.",
  "users": {
    "admin": { "username": "Admin", "password": "admin123" },
    "invalid": { "username": "invalid_user", "password": "wrong_password" }
  }
}
```

**`src/data/login/expected.json`** — expected UI text:
```json
{
  "_comment": "Expected UI text for login feature verification.",
  "errors": {
    "invalidCredentials": "Invalid credentials",
    "requiredField": "Required",
    "accountDisabled": "Account disabled"
  },
  "labels": {
    "pageTitle": "OrangeHRM",
    "loginButtonText": "Login"
  }
}
```

**`src/data/dashboard/expected.json`** — expected dashboard text:
```json
{
  "_comment": "Expected UI text for dashboard verification.",
  "labels": {
    "pageTitle": "OrangeHRM",
    "headerTitle": "Dashboard"
  }
}
```

### 9.3 Data Loaders

**`DataLoader`** — generic JSON reader:
```typescript
import { DataLoader } from '../src/config/page-loader';
import { LoginExpectedFile } from '../src/config/page-loader';

// Load by feature path (resolves to src/data/login/expected.json)
const expected = DataLoader.load<LoginExpectedFile>('login/expected');
console.log(expected.errors.invalidCredentials); // "Invalid credentials"
```

**`CredentialResolver`** — user credentials with Cypress.env() override:
```typescript
import { CredentialResolver } from '../src/config/page-loader';

// Get a specific user
const admin = CredentialResolver.getUser('admin');

// Get all users (for data-driven tests)
const allUsers = CredentialResolver.getAllUsers();
```

**Credential resolution strategy:**
```
CredentialResolver.getUser('admin')
  ├─ Load src/data/login/users.json
  ├─ If Cypress.env() has ADMIN_USERNAME + ADMIN_PASSWORD → override 'admin' entry
  └─ Return LoginCredentials object
```

### 9.4 Tester Workflow

**To add a new test user** (no TypeScript needed):
1. Open `src/data/login/users.json`
2. Add: `"newUser": { "username": "...", "password": "..." }`
3. Done. Tests use `CredentialResolver.getUser('newUser')`

**To update expected error messages:**
1. Open `src/data/login/expected.json`
2. Edit the value under `errors.invalidCredentials`
3. Done. All tests referencing this value update automatically.

**To add test data for a new feature:**
1. Create JSON file: `src/data/[feature]/[datatype].json`
2. Create interface: `src/config/data/interfaces/[feature].interfaces.ts`
3. Export from `src/config/data/interfaces/index.ts`
4. Load in tests: `DataLoader.load<NewInterface>('[feature]/[datatype]')`

### 9.5 Rules

- All test data lives in `src/data/` as JSON files — never hardcode in tests or page objects
- All TypeScript interfaces live in `src/config/data/interfaces/`
- Use `DataLoader.load<T>()` to read JSON — never `import` JSON directly
- Use `CredentialResolver.getUser()` for credentials — never read `Cypress.env()` directly in tests
- Use descriptive key names in JSON (`admin`, `invalid`, `locked`, `withSpecialChars`)
- Use `_comment` field in JSON for documentation (JSON has no native comments)

---

## 10. Logger System

### 10.1 cy.step() — cypress-plugin-steps

Step logging uses the **`cypress-plugin-steps`** npm package. The `cy.step()` command is globally available — no import required in page objects or panels.

**Registration:** `import 'cypress-plugin-steps'` in `cypress/support/e2e.ts` (already configured).

**Command:** `cy.step('name')` — call it as the first line of a method, before the cy commands it describes.

Features: automatic step numbering, section support (`cy.section()`), todo items (`cy.todo()`).

**Usage — action method:**
```typescript
step_login(credentials: LoginCredentials): this {
  cy.step('step_login');
  cy.get(this.usernameInput).clear().type(credentials.username);
  cy.get(this.passwordInput).clear().type(credentials.password);
  cy.get(this.loginButton).click();
  return this;
}
```

**Usage — getter method (panel):**
```typescript
getProfileName(): Cypress.Chainable<string> {
  cy.step('getProfileName');
  return cy.get(this.profileName, { timeout: 10000 })
    .should('be.visible')
    .invoke('text')
    .then(text => text.trim());
}
```

### 10.2 Logging Functions

| Function | Output | Where to Use |
|----------|--------|-------------|
| `logSuite(name)` | `@suite :: Name` (console) | First line of `describe()` |
| `logTest(name)` | `@test :: Name` (command log) | First line of each `it()` |
| `logField(label, value)` | `Label                : value` | Page objects for debugging |
| `logUrl(label, url)` | `Label                → url` | Page objects for debugging |
| `logSep()` | `━━━━━━━━━━━━━━━...` | Visual separator |
| `logSuccess(msg)` | `✔  msg` | Post-step confirmation |

**Note:** `logSuite()` uses `console.log()` because `cy.log()` only works inside test/hook context. `logTest()` uses `cy.log()` for visibility in the Cypress command log.

---

## 11. Cypress Configuration

### 11.1 Full Configuration

**File:** `cypress.config.ts`

```typescript
import { defineConfig } from 'cypress';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

export default defineConfig({
  e2e: {
    baseUrl: process.env.BASE_URL,
    specPattern: 'features/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    defaultCommandTimeout: 15000,
    pageLoadTimeout: 30000,
    screenshotOnRunFailure: true,
    video: true,
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
      // Webpack preprocessor for path aliases + TypeScript
      // readJsonFile task for Node-side file reading
      return config;
    },
  },
});
```

### 11.2 Key Settings

| Setting | Value | Purpose |
|---------|-------|---------|
| `specPattern` | `features/**/*.cy.ts` | All tests live in features/ |
| `defaultCommandTimeout` | 15000ms | Max wait for cy commands (was actionTimeout) |
| `pageLoadTimeout` | 30000ms | Max wait for page navigation (was navigationTimeout) |
| `screenshotOnRunFailure` | `true` | Auto-screenshot on failure only |
| `screenshotsFolder` | `test-results/screenshots` | Failure screenshots location |
| `video` | `true` | Record all; passing videos deleted in `after:spec` |
| `videosFolder` | `test-results/videos` | Failure videos location |
| `retries.runMode` | 2 in CI, 1 local | Retry counts |
| `chromeWebSecurity` | `false` | Allow cross-origin requests |
| `supportFile` | `cypress/support/e2e.ts` | Global hooks and custom commands |

### 11.3 Output Artifacts (Every Run)

All outputs are written to `test-results/` (git-ignored). Run `npm run clean` to wipe between runs.

| Artifact | Location | Written by | Content |
|----------|----------|------------|---------|
| Screenshots | `test-results/screenshots/` | Cypress (auto) | Failures only |
| Videos | `test-results/videos/` | Cypress + `after:spec` | Failures only — passing spec videos auto-deleted |
| Logs | `test-results/logs/run-<ts>.log` | `cy.task('log')` | All `logSuite`/`logTest`/`logField` output |
| Report (HTML) | `test-results/reports/index.html` | cypress-mochawesome-reporter | Full run summary with charts |
| Report (JSON) | `test-results/reports/results.json` | `after:run` hook | Consolidated mochawesome JSON of all specs (per-spec `.jsons/` dir auto-deleted) |
| Meta artifacts | `test-results/artifacts/meta/<spec>.json` | `after:spec` (auto) | Timing, pass/fail counts per spec |
| Network artifacts | `test-results/artifacts/network/` | `cy.task('saveArtifact')` | XHR/fetch logs (manual in tests) |
| Console artifacts | `test-results/artifacts/console/` | `cy.task('saveArtifact')` | Browser console output (manual in tests) |
| Data artifacts | `test-results/artifacts/data/` | `cy.task('saveArtifact')` | Test data snapshots (manual in tests) |

**Saving a custom artifact from a test:**
```typescript
cy.task('saveArtifact', {
  folder: 'network',          // network | console | data
  filename: 'login-xhr.json',
  content: JSON.stringify(payload, null, 2),
});
```

---

## 12. Environment Configuration

### 12.1 .env File

```bash
# Application Base URL
BASE_URL=https://opensource-demo.orangehrmlive.com

# Admin Credentials
ADMIN_USERNAME=Admin
ADMIN_PASSWORD=admin123
```

### 12.2 Rules

- `.env` **is tracked in git** (unlike typical projects) for quick project setup
- `dotenv` is loaded in `cypress.config.ts` and values are injected via `env` block
- In test code, use `Cypress.env('VAR')` — never `process.env` (not available in browser)
- In `cypress.config.ts` (Node context), use `process.env.VAR`

---

## 13. Step-by-Step: Creating a New Test

Follow this walkthrough when adding a test for a new feature.

### Scenario: Add tests for an "Employee List" page

**Step 1: Create the Page Object** — `src/gui/pages/EmployeeListPage.ts`

```typescript
import { BasePage } from './BasePage';

export class EmployeeListPage extends BasePage {
  readonly path = '/web/index.php/pim/viewEmployeeList';

  private searchInput   = 'input[placeholder="Type for hints..."]';
  private searchButton  = 'button[type="submit"]';
  private employeeTable = '.oxd-table-body';

  step_navigate(): this {
    cy.step('step_navigate');
    cy.visit(this.path);
    this.waitForPageLoad();
    return this;
  }

  step_searchEmployee(name: string): this {
    cy.step('step_searchEmployee');
    cy.get(this.searchInput).clear().type(name);
    cy.get(this.searchButton).click();
    this.waitForPageLoad();
    return this;
  }

  verify_onEmployeeList(): this {
    cy.step('verify_onEmployeeList');
    cy.url().should('include', 'viewEmployeeList');
    return this;
  }

  verify_tableVisible(): this {
    cy.step('verify_tableVisible');
    cy.get(this.employeeTable).should('be.visible');
    return this;
  }
}
```

**Step 2: Export in Page Loader** — `src/config/page-loader.ts`

```typescript
export { LoginPage } from '../gui/pages/LoginPage';
export { DashboardPage } from '../gui/pages/DashboardPage';
export { EmployeeListPage } from '../gui/pages/EmployeeListPage';  // ADD
```

**Step 3: Write the Test** — `features/employee-list.cy.ts`

```typescript
import { EmployeeListPage, logSuite, logTest } from '../src/config/page-loader';

describe('OrangeHRM - Employee List', () => {
  logSuite('OrangeHRM - Employee List');

  beforeEach(() => {
    cy.adminLogin();
  });

  it('should navigate to employee list page after authenticated session', () => {
    logTest('should navigate to employee list page after authenticated session');
    const employeeList = new EmployeeListPage();

    employeeList.step_navigate();
    employeeList.verify_onEmployeeList();
    employeeList.verify_tableVisible();
  });
});
```

**Step 4: Verify**

```bash
npm run audit          # TypeScript compiles without errors
npm run ui:headless    # All tests pass
```

---

## 14. Step-by-Step: Creating a New Panel

### Scenario: Add a reusable Sidebar Navigation panel

**Step 1: Create the Panel** — `src/gui/panels/SidebarPanel.ts`

```typescript
export class SidebarPanel {
  private menuItems  = '.oxd-main-menu-item';
  private searchInput = '.oxd-main-menu-search input';

  clickMenuItem(name: string): this {
    cy.step('clickMenuItem');
    cy.contains(this.menuItems, name).click();
    return this;
  }

  searchMenu(text: string): this {
    cy.step('searchMenu');
    cy.get(this.searchInput).clear().type(text);
    return this;
  }
}
```

**Step 2: Export in Page Loader** — add to `src/config/page-loader.ts`:
```typescript
export { SidebarPanel } from '../gui/panels/SidebarPanel';
```

**Step 3: Compose into a Page Object** (if used on specific pages):
```typescript
export class DashboardPage extends BasePage {
  readonly topNav = new HeaderPanel();
  readonly sidebar = new SidebarPanel();  // ADD
}
```

---

## 15. Code Review Checklist

### Page Object Review

| # | Check | Pass? |
|---|-------|-------|
| 1 | Extends `BasePage` |  |
| 2 | Has `readonly path` property |  |
| 3 | All locators are `private` string properties |  |
| 4 | Actions use `step_*` prefix |  |
| 5 | Verifications use `verify_*` prefix |  |
| 6 | All public methods call `cy.step('name')` before commands |  |
| 7 | All methods return `this` |  |
| 8 | Uses `cy.get()` / `cy.visit()` — no raw DOM access |  |
| 9 | Imports use path aliases (`@config/*`, `@data/*`, `@gui/*`) |  |
| 10 | No hardcoded test data — uses `@data/interfaces` types |  |
| 11 | Exported in `page-loader.ts` |  |
| 12 | `npm run audit` passes (TypeScript compiles) |  |

### Panel Review

| # | Check | Pass? |
|---|-------|-------|
| 1 | Does **not** extend `BasePage` |  |
| 2 | Locators are `private` string properties |  |
| 3 | All public methods call `cy.step('name')` before commands |  |
| 4 | Exported in `page-loader.ts` |  |
| 5 | Composed into relevant page objects (not used directly in tests) |  |

### Test Review

| # | Check | Pass? |
|---|-------|-------|
| 1 | Located in `features/` directory |  |
| 2 | File named `[feature].cy.ts` |  |
| 3 | Imports only from `../src/config/page-loader` |  |
| 4 | Uses `new PageObject()` (no constructor args) |  |
| 5 | Uses `cy.adminLogin()` correctly for pre-auth tests |  |
| 6 | Has `cy.clearCookies()` + `cy.clearLocalStorage()` if testing login flow |  |
| 7 | Includes `logSuite()` at start of `describe()` |  |
| 8 | Includes `logTest()` at start of each `it()` |  |
| 9 | No DOM selectors or `cy.get()` calls in test body |  |
| 10 | Test data from JSON via `DataLoader`/`CredentialResolver`, no hardcoded values |  |
| 11 | Test names follow `should [behavior] when/for [condition]` |  |
| 12 | No `async/await` — uses Cypress command chains |  |
| 13 | `npm run ui:headless` passes |  |

---

## 16. Anti-Patterns & Common Mistakes

### Mistake 1: DOM Logic in Tests

```typescript
// WRONG — selectors belong in page objects
it('should login', () => {
  cy.get('input[name="username"]').type('Admin');
  cy.get('button[type="submit"]').click();
});

// CORRECT
it('should login', () => {
  const loginPage = new LoginPage();
  loginPage.step_navigate();
  loginPage.step_login(CredentialResolver.getUser('admin'));
});
```

### Mistake 2: Hardcoded Credentials

```typescript
// WRONG — hardcoded values
loginPage.step_login({ username: 'Admin', password: 'admin123' });

// CORRECT — from CredentialResolver (reads JSON + Cypress.env() override)
loginPage.step_login(CredentialResolver.getUser('admin'));
```

### Mistake 3: Missing cy.step() Call

```typescript
// WRONG — no logging, invisible in command log
step_navigate(): this {
  cy.visit(this.path);
  return this;
}

// CORRECT — cy.step() before the commands it describes
step_navigate(): this {
  cy.step('step_navigate');
  cy.visit(this.path);
  return this;
}
```

### Mistake 4: Public Locators

```typescript
// WRONG — locators should be encapsulated
public usernameInput = 'input[name="username"]';

// CORRECT
private usernameInput = 'input[name="username"]';
```

### Mistake 5: Scattered Imports

```typescript
// WRONG — multiple import sources in test files
import { CredentialResolver } from '../src/config/data/loaders';
import { DataLoader } from '../src/config/data/loaders';
import { LoginExpectedFile } from '../src/config/data/interfaces';
import { logSuite, logTest } from '../src/config/utils/logger';

// CORRECT — one import for everything
import {
  CredentialResolver, DataLoader, LoginExpectedFile, logSuite, logTest,
} from '../src/config/page-loader';
```

### Mistake 6: Using async/await

```typescript
// WRONG — Cypress does not use async/await
it('should login', async () => {
  await loginPage.step_navigate();
  await loginPage.step_login(CredentialResolver.getUser('admin'));
});

// CORRECT — synchronous Cypress chains
it('should login', () => {
  loginPage.step_navigate();
  loginPage.step_login(CredentialResolver.getUser('admin'));
});
```

### Mistake 7: Hardcoded Environment Values

```typescript
// WRONG
const baseUrl = Cypress.env('BASE_URL') || 'https://default.com';

// CORRECT — use baseUrl from cypress.config.ts (set via .env)
cy.visit('/path');  // Cypress prepends baseUrl automatically
```

### Mistake 8: Hardcoded Expected Values in Tests

```typescript
// WRONG — hardcoded string in test
loginPage.verify_errorMessage('Invalid credentials');

// CORRECT — from JSON data files (tester-editable)
const expected = DataLoader.load<LoginExpectedFile>('login/expected');
loginPage.verify_errorMessage(expected.errors.invalidCredentials);
```

### Mistake 9: Reading Credentials Directly from Cypress.env()

```typescript
// WRONG — bypasses CredentialResolver, duplicates logic
const username = Cypress.env('ADMIN_USERNAME');
const password = Cypress.env('ADMIN_PASSWORD');

// CORRECT — single source of truth with Cypress.env() override support
const admin = CredentialResolver.getUser('admin');
```

### Mistake 10: Forgetting to Register New Pages

Creating a page object but forgetting to:
1. Export it in `page-loader.ts`

Both steps are required for every new page.

### Mistake 11: Not Returning `this`

```typescript
// WRONG — breaks method chaining contract
step_navigate(): void {
  cy.step('step_navigate');
  cy.visit(this.path);
}

// CORRECT
step_navigate(): this {
  cy.step('step_navigate');
  cy.visit(this.path);
  return this;
}
```

### Mistake 12: Missing Logging Calls

```typescript
// WRONG — no visibility in test output
describe('Suite', () => {
  it('test name', () => {
    const loginPage = new LoginPage();
    loginPage.step_navigate();
  });
});

// CORRECT
describe('Suite', () => {
  logSuite('Suite');
  it('test name', () => {
    logTest('test name');
    const loginPage = new LoginPage();
    loginPage.step_navigate();
  });
});
```

### Mistake 13: Constructor Parameters in Page Objects

```typescript
// WRONG — Cypress provides cy globally, no need for constructor args
export class LoginPage extends BasePage {
  constructor(page: any) {
    super(page);
  }
}

// CORRECT — no constructor needed (inherits from BasePage)
export class LoginPage extends BasePage {
  readonly path = '/web/index.php/auth/login';
  // ... methods
}
```

---

## 17. Troubleshooting

### "Cannot find module" errors

**Cause:** Path alias not resolved by webpack or page not exported.

**Fix:**
1. Verify `cypress.config.ts` has the alias in `webpackOptions.resolve.alias`
2. Check `page-loader.ts` exports the module
3. Run `npm run audit` to validate TypeScript

### Session-related failures

**Cause:** `cy.session()` cached stale session.

**Fix:**
```bash
npm run clean          # Remove stale artifacts
npm run ui:headless    # Re-runs with fresh sessions
```

Or in Cypress interactive mode, click "Clear All Sessions" in the test runner.

### Authentication fails in cy.adminLogin()

**Cause:** Target app is down, or selectors have changed.

**Fix:**
1. Check `BASE_URL` in `.env` is accessible
2. Run `npm run ui:open` to step through interactively
3. Verify login form selectors in `cypress/support/commands.ts`

### Tests pass locally but fail in CI

**Check:**
- `retries.runMode` is set to 2 in CI
- `chromeWebSecurity` is `false`
- Target application is accessible from CI environment
- `--browser chrome --headless` in CI script

### Webpack/TypeScript build errors

**Cause:** Missing webpack config for path aliases.

**Fix:**
1. Verify `@cypress/webpack-preprocessor` is installed
2. Check `cypress.config.ts` `setupNodeEvents` has webpack config
3. Ensure `ts-loader` and `webpack` are in devDependencies

---

## 18. Playwright-to-Cypress Mapping Reference

| Playwright | Cypress | Notes |
|---|---|---|
| `Page` constructor param | `cy` global | No constructor needed |
| `async/await` | Synchronous chains | Cypress enqueues commands internally |
| `@step` decorator | `cy.step('name')` | `cypress-plugin-steps` plugin, globally available |
| `page.config.ts` fixtures | `new PageObject()` in tests | No fixture system |
| `authenticatedPage` fixture | `cy.adminLogin()` | Uses `cy.session()` |
| `global-setup.ts` | `cy.session()` | Lazy, cached on first use |
| `test.describe` / `test` | `describe` / `it` | Mocha syntax |
| `expect(x).toContain(y)` | `.should('contain', y)` | Chai-based |
| `page.goto(url)` | `cy.visit(url)` | |
| `page.locator(sel)` | `cy.get(sel)` | |
| `locator.fill(text)` | `cy.get(sel).clear().type(text)` | |
| `locator.click()` | `cy.get(sel).click()` | |
| `expect(page).toHaveURL()` | `cy.url().should('include', ...)` | |
| `page.title()` | `cy.title()` | Returns Chainable |
| `process.env.X` | `Cypress.env('X')` | In browser context |
| `storageState: {}` | `cy.clearCookies()` + `cy.clearLocalStorage()` | Clear auth |

---

## 19. Quick Reference

| Aspect | Location | Key Rule |
|--------|----------|----------|
| **Config** | `.env` | Single source of truth, no fallback defaults |
| **Base Class** | `src/gui/pages/BasePage.ts` | Immutable — all pages extend this |
| **Page Objects** | `src/gui/pages/*.ts` | Extend BasePage, `cy.step()`, `step_*/verify_*`, return `this` |
| **Panels** | `src/gui/panels/*.ts` | No BasePage, compose into pages |
| **Test Data (JSON)** | `src/data/` | Tester-editable JSON files, no TS needed |
| **Data Interfaces** | `src/config/data/interfaces/` | TypeScript shape definitions |
| **Data Loaders** | `src/config/data/loaders/` | `DataLoader` + `CredentialResolver` |
| **Tests** | `features/*.cy.ts` | No async/await, `new PageObject()`, `logSuite/logTest` |
| **Page Registry** | `src/config/page-loader.ts` | Barrel exports — single import source |
| **Logger** | `src/config/utils/logger.ts` | Logging utilities (`logSuite`, `logTest`, etc.) |
| **Step Logging** | `cypress-plugin-steps` | `cy.step('name')` — global, no import needed |
| **Auth** | `cypress/support/commands.ts` | `cy.adminLogin()` via `cy.session()` |
| **Test Results** | `test-results/` | Screenshots/videos (failures), logs, mochawesome report, artifacts |
| **TS Config** | `tsconfig.json` | Strict mode, 6 path aliases |
| **CY Config** | `cypress.config.ts` | Chrome, CI-aware retries, webpack preprocessor |

---

## Versioning

- **Skill Version:** 2.3
- **Last Updated:** March 26, 2026
- **Compatible with:** Cypress 13+, TypeScript 5.9+, Node 18+
- **Dependencies:** `cypress`, `cypress-plugin-steps`, `cypress-mochawesome-reporter`, `typescript`, `dotenv`, `@types/node`, `@cypress/webpack-preprocessor`, `ts-loader`, `webpack`
