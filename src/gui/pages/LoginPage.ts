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

  step_login(credentials: LoginCredentials): DashboardPage {
    cy.step('step_login');
    cy.get(this.usernameInput).clear().type(credentials.username);
    cy.get(this.passwordInput).clear().type(credentials.password);
    cy.get(this.loginButton).click();
    this.waitForPageLoad();
    return new DashboardPage();
  }

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
