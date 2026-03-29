declare global {
  namespace Cypress {
    interface Chainable {
      adminLogin(): Chainable<void>;
      stepFlush(): Chainable<void>;
      stepClear(): Chainable<void>;
    }
  }
}

// ── Step buffer — module-level singleton in the support file ─────────────────
// Populated via 'command:start' event (fires for every cy.step() call).
// Status is determined by:
//   - 'fail' event: marks the last active step as failed; all prior steps passed.
//   - No failure: all steps passed.

const __stepBuffer: string[] = [];
let __failedAtIndex = -1;

Cypress.on('command:start', (cmd: any) => {
  if (cmd.get('name') === 'step') {
    const name = cmd.get('args')?.[0];
    if (name) __stepBuffer.push(name as string);
  }
});

Cypress.on('fail', (err) => {
  // Record which step was active when the test failed (last one started).
  // Re-throw so Cypress still marks the test as failed.
  __failedAtIndex = __stepBuffer.length - 1;
  throw err;
});

// cy.stepFlush() — called from afterEach in logger.ts
// Emits each step with ✔ (pass) or ✖ (fail) prefix.
Cypress.Commands.add('stepFlush', () => {
  if (__stepBuffer.length > 0) {
    const lines = __stepBuffer
      .map((name, i) =>
        i === __failedAtIndex
          ? `      \u2716 ${name}`  // ✖ failed step
          : `      \u2714 ${name}`  // ✔ passed step
      )
      .join('\n');

    __stepBuffer.length = 0;
    __failedAtIndex = -1;
    cy.task('log', lines);
  }
});

// cy.stepClear() — called from logTest / before hooks to reset the buffer
Cypress.Commands.add('stepClear', () => {
  __stepBuffer.length = 0;
  __failedAtIndex = -1;
});

// ── cy.adminLogin() ───────────────────────────────────────────────────────────

/**
 * Custom command: cy.adminLogin()
 *
 * Authenticates as admin using cy.session() for session caching.
 * Equivalent to Playwright's global-setup + authenticatedPage fixture.
 * The login flow runs only once per spec run; subsequent calls restore cached session.
 */
Cypress.Commands.add('adminLogin', () => {
  const username = Cypress.env('ADMIN_USERNAME') || 'Admin';
  const password = Cypress.env('ADMIN_PASSWORD') || 'admin123';

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

export {};
