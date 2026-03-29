// ── Logger utilities ─────────────────────────────────────────
//
// All terminal-visible output uses cy.task('log') which crosses the
// browser → Node boundary and writes to process.stdout.
//
// WHY cy.stepPush / cy.stepFlush (custom commands in support/commands.ts):
//   - Module-level arrays in logger.ts: webpack creates separate instances for
//     relative-path vs @config-alias imports — state written by page objects
//     is invisible to logSuite's closure.
//   - Cypress.env() writes: silently ignored from browser bundle in Cypress 15.
//   - window object: spec runner window is an iframe; resets on cy.visit().
//   - SUPPORT FILE module (commands.ts): compiled ONCE by Cypress before any spec,
//     guaranteed singleton. Custom commands bridge any caller to that single state.
//
// WHY buffer + afterEach flush (not cy.task() directly in step()):
//   Cypress uses ANSI cursor controls during active test execution; any
//   process.stdout.write() is overwritten. Flushing in afterEach — after Cypress
//   commits the ✓ line — survives.

const SEP = '━'.repeat(55);

/**
 * Log a separator line to the terminal.
 */
export function logSep(): void {
  cy.task('log', SEP);
}

/**
 * Log a key-value field to the terminal.
 */
export function logField(label: string, value: string | number): void {
  cy.task('log', `  ${label.padEnd(22)} : ${value}`);
}

/**
 * Log a URL field to the terminal.
 */
export function logUrl(label: string, url: string): void {
  cy.task('log', `  ${label.padEnd(22)} -> ${url}`);
}

/**
 * Log a success message to the terminal.
 */
export function logSuccess(message: string): void {
  cy.task('log', `  [ok] ${message}`);
}

// ── Test logging functions ───────────────────────────────────

/**
 * LOG SUITE: Logs when a test suite (describe block) starts.
 *
 * Registers a before() for the @suite terminal line and an afterEach()
 * that flushes collected step names to the terminal after Cypress commits ✓.
 *
 * Usage: logSuite('Suite Name')  <- first line of describe block
 */
export function logSuite(name: string): void {
  before(() => {
    cy.stepClear();
    cy.task('log', `\n@suite :: ${name}`);
  });

  afterEach(() => {
    cy.stepFlush();
  });
}

/**
 * LOG TEST: Logs when a test case starts.
 * Uses cy.task() for terminal visibility + cy.log() for Cypress command log.
 * Usage: logTest('Test Name')  <- first line of each it() body
 */
export function logTest(name: string): void {
  cy.stepClear();
  cy.task('log', `  @test :: ${name}`);
  cy.log(`@test :: ${name}`);
}

/**
 * Step wrapper: records the step name via cy.stepPush() (flushed to terminal
 * in afterEach) and logs it via cypress-plugin-steps for the Cypress UI / video.
 *
 * Generic return type allows wrapping both action methods (return this)
 * and getter methods (return Cypress.Chainable<T>).
 *
 * Usage - action method:
 *   step_navigate(): this {
 *     step('step_navigate', () => { cy.visit(this.path); });
 *     return this;
 *   }
 *
 * Usage - getter method (panel):
 *   getProfileName(): Cypress.Chainable<string> {
 *     return step('getProfileName', () => cy.get(sel).invoke('text'));
 *   }
 */
export function step<T = void>(name: string, fn: () => T): T {
  cy.step(name);
  return fn();
}
