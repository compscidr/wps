import { FIRE_BEHAVIOUR_ADVISORY_ROUTE } from '../../src/utils/constants'

describe('Fire Behaviour Advisory Page', () => {
  beforeEach(() => {
    cy.intercept('GET', 'api/stations/*', { fixture: 'weather-stations.json' }).as(
      'getStations'
    )
    cy.intercept('GET', 'api/fba/fire-centers', { fixture: 'fba/fire-centers.json' }).as(
      'fireCenters'
    )

    cy.visit(FIRE_BEHAVIOUR_ADVISORY_ROUTE)
  })

  it('Renders the initial page', () => {
    cy.contains('Fire Behaviour Advisory Tool')
    cy.getByTestId('fire-center-dropdown').should('be.visible')
    cy.getByTestId('fba-map').should('be.visible')
  })
})
