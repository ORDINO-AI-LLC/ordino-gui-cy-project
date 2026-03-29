export class HeaderPanel {
  private profileBadge = '.oxd-userdropdown';
  private profileName  = '.oxd-userdropdown-name';

  getProfileName(): Cypress.Chainable<string> {
    cy.step('getProfileName');
    return cy.get(this.profileName, { timeout: 10000 })
      .should('be.visible')
      .invoke('text')
      .then(text => text.trim());
  }

  openProfileMenu(): this {
    cy.step('openProfileMenu');
    cy.get(this.profileBadge).click();
    return this;
  }
}
