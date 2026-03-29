import { LoginPage, CredentialResolver, DataLoader, LoginExpectedFile, logSuite, logTest } from '../src/config/page-loader';

const expected = DataLoader.load<LoginExpectedFile>('login/expected');

describe('OrangeHRM - Login', () => {
  logSuite('OrangeHRM - Login');

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should login successfully and verify profile name on home page', () => {
    logTest('should login successfully and verify profile name on home page');

    new LoginPage()
      .step_navigate()
      .step_login(CredentialResolver.getUser('admin'))
      .verify_onDashboard()
      .verify_profileName();
  });

  it('should show error message for invalid credentials', () => {
    logTest('should show error message for invalid credentials');

    new LoginPage()
      .step_navigate()
      .step_loginExpectError(CredentialResolver.getUser('invalid'))
      .verify_errorMessage(expected.errors.invalidCredentials);
  });
});
