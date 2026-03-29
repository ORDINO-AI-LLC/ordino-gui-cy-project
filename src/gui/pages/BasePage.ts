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
