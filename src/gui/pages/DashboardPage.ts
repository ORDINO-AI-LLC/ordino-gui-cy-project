import { BasePage } from './BasePage';
import { HeaderPanel } from '@gui/panels/HeaderPanel';

export class DashboardPage extends BasePage {
  readonly path = '/web/index.php/dashboard/index';
  readonly topNav = new HeaderPanel();

  step_navigate(): this {
    cy.step('step_navigate');
    cy.visit(this.path);
    cy.url().should('include', 'dashboard');
    this.waitForPageLoad();
    return this;
  }

  verify_onDashboard(): this {
    cy.step('verify_onDashboard');
    cy.url().should('include', 'dashboard');
    return this;
  }

  verify_pageTitle(expectedTitle: string): this {
    cy.step('verify_pageTitle');
    cy.title().should('contain', expectedTitle);
    return this;
  }

  verify_profileName(): this {
    cy.step('verify_profileName');
    this.topNav.getProfileName()
      .should('not.be.empty');
    return this;
  }
}
