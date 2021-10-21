import { makeStyles, TableCell } from '@material-ui/core'
import { fireTableStyles } from 'app/theme'
import { calculatePrepLevel } from 'features/hfiCalculator/components/prepLevel'
import React from 'react'

export interface PrepLevelCellProps {
  testid?: string
  meanIntensityGroup: number | undefined
  areaName: string
}

const prepLevelColours: { [description: string]: string } = {
  green: '#A0CD63',
  blue: '#4CAFEA',
  yellow: '#FFFD54',
  orange: '#F6C142',
  brightRed: '#EA3223',
  bloodRed: '#B02318'
}

const useStyles = makeStyles({
  ...fireTableStyles,
  prepLevel1: {
    ...fireTableStyles.calculatedPlanningCell,
    background: prepLevelColours.green
  },
  prepLevel2: {
    ...fireTableStyles.calculatedPlanningCell,
    background: prepLevelColours.blue
  },
  prepLevel3: {
    ...fireTableStyles.calculatedPlanningCell,
    background: prepLevelColours.yellow
  },
  prepLevel4: {
    ...fireTableStyles.calculatedPlanningCell,
    background: prepLevelColours.orange
  },
  prepLevel5: {
    ...fireTableStyles.calculatedPlanningCell,
    background: prepLevelColours.brightRed,
    color: 'white'
  },
  prepLevel6: {
    ...fireTableStyles.calculatedPlanningCell,
    background: prepLevelColours.bloodRed,
    color: 'white'
  }
})

const PrepLevelCell = (props: PrepLevelCellProps) => {
  const classes = useStyles()

  const prepLevel = calculatePrepLevel(props.meanIntensityGroup)

  const formatPrepLevelByValue = () => {
    switch (prepLevel) {
      case 1:
        return classes.prepLevel1
      case 2:
        return classes.prepLevel2
      case 3:
        return classes.prepLevel3
      case 4:
        return classes.prepLevel4
      case 5:
        return classes.prepLevel5
      case 6:
        return classes.prepLevel6
      default:
        return classes.defaultBackground
    }
  }

  return (
    <TableCell className={formatPrepLevelByValue()} data-testid={props.testid}>
      {prepLevel}
    </TableCell>
  )
}

export default React.memo(PrepLevelCell)
