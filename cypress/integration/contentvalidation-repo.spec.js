describe('uW Content Validation Repository Tests', function () {
  before(() => {
    cy.visit('/')
  })
  it('Should be at home page with README', function () {
    cy.get('.rsg--sectionName-12').should('have.text', 'README')
  })


  // it('Should find a total of 80 words in entire repo', function() {
  //   // first click to the ContentCheckRepo component
  //   cy.get(':nth-child(3) > .rsg--list-54 > .rsg--item-55 > .rsg--link-25')
  //   .click()

  //   cy.get('[data-testid=ContentCheckRepo-example-1] > .rsg--preview-42 > :nth-child(1) > div.ContentCheckRepo-root-1 > .MuiPaper-elevation1 > .ContentCheckRepo-root-1 > :nth-child(1)')
  //   .should('have.text','80')
  // })


  // it('Should find 33 words in folder of files', function() {
  //   // first click to the ContentCheckRepo component
  //   cy.get(':nth-child(3) > .rsg--list-54 > .rsg--item-55 > .rsg--link-25')
  //   .click()

  //   cy.get('[data-testid=ContentCheckRepo-example-3] > .rsg--preview-42 > :nth-child(1) > div.ContentCheckRepo-root-1 > .MuiPaper-elevation1 > .ContentCheckRepo-root-1 > :nth-child(1)')
  //   .should('have.text','33')
  // })


  // it('Should find 11 words in single file', function() {
  //   // first click to the ContentCheckRepo component
  //   cy.get(':nth-child(3) > .rsg--list-54 > .rsg--item-55 > .rsg--link-25')
  //   .click()

  //   cy.get('[data-testid=ContentCheckRepo-example-5] > .rsg--preview-42 > :nth-child(1) > div.ContentCheckRepo-root-1 > .MuiPaper-elevation1 > .ContentCheckRepo-root-1 > :nth-child(1)')
  //   .should('have.text','11')
  // })


  // it('Should find 35 words in single USFM file', function() {
  //   // first click to the ContentCheckRepo component
  //   cy.get(':nth-child(3) > .rsg--list-54 > .rsg--item-55 > .rsg--link-25')
  //   .click()

  //   cy.get('[data-testid=ContentCheckRepo-example-7] > .rsg--preview-42 > :nth-child(1) > div.ContentCheckRepo-root-1 > .MuiPaper-elevation1 > .ContentCheckRepo-root-1 > :nth-child(1)')
  //   .should('have.text','35')
  // })


  // it('Should find 565 words in UTN (column 8) text', function() {
  //   // first click to the ContentCheckRepo component
  //   cy.get(':nth-child(3) > .rsg--list-54 > .rsg--item-55 > .rsg--link-25')
  //   .click()

  //   cy.get('[data-testid=ContentCheckRepo-example-8] > .rsg--preview-42 > :nth-child(1) > div.ContentCheckRepo-root-1 > .MuiPaper-elevation1 > .ContentCheckRepo-root-1 > :nth-child(1)')
  //   .should('have.text','565')
  // })
})