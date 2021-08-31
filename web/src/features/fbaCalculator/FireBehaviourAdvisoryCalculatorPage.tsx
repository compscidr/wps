import { makeStyles, Paper } from '@material-ui/core'
import { Container, PageHeader } from 'components'
import React from 'react'
import FBATable from 'features/fbaCalculator/components/FBATable'

export const FireBehaviourAdvisoryCalculator: React.FunctionComponent = () => {
  const useStyles = makeStyles(theme => ({
    disclaimer: {
      borderLeft: '6px solid #FCBA19',
      padding: '10px',
      marginBottom: theme.spacing(8)
    }
  }))

  const classes = useStyles()
  return (
    <main>
      <PageHeader
        title="Predictive Services Unit"
        productName="Predictive Services Unit"
      />
      <Container maxWidth={'xl'}>
        <h1>
          {/* (🔥🦇) */}
          Fire Behaviour Advisory Tool <b style={{ color: 'Red' }}>Prototype</b>
        </h1>

        <FBATable />
        <Paper className={classes.disclaimer}>
          <div>
            <h4>Disclaimers:</h4>
            <p>
              Forecasted weather outputs are for 13:00 and FWI Indices are for 17:00 PDT.
              These fire behaviour calculations assume flat terrain.
            </p>
            <p>
              Weather and fire behaviour indices are sourced from the Wildfire One API.
            </p>
            <p>
              Values are calculated using the{' '}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://r-forge.r-project.org/projects/cffdrs/"
              >
                Canadian Forest Fire Danger Rating System R Library
              </a>{' '}
              and are intended to provide general guidance for Fire Behaviour Advisories.
            </p>
            <p>
              Constants for crown fuel load are taken from &quot;Development and Structure
              of the Canadian Forest Fire Behaviour Prediction System&quot; from Forestry
              Canada Fire Danger Group, Information Report ST-X-3, 1992.
            </p>
          </div>
        </Paper>
      </Container>
    </main>
  )
}