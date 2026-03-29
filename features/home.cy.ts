import { DashboardPage, DataLoader, DashboardExpectedFile, logSuite, logTest } from '../src/config/page-loader';

const expected = DataLoader.load<DashboardExpectedFile>('dashboard/expected');

describe('OrangeHRM - Home (Dashboard)', () => {
  logSuite('OrangeHRM - Home');

  beforeEach(() => {
    cy.adminLogin();
  });

  it('should display dashboard home page with profile visible after authenticated session', () => {
    logTest('should display dashboard home page with profile visible after authenticated session');

    new DashboardPage()
      .step_navigate()
      .verify_onDashboard()
      .verify_pageTitle(expected.labels.pageTitle)
      .verify_profileName();
  });
});
