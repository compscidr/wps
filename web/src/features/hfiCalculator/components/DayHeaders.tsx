import { TableCell } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { fireTableStyles } from 'app/theme'
import { NUM_WEEK_DAYS } from 'features/hfiCalculator/constants'
import { range } from 'lodash'
import React from 'react'
import { getPrepWeeklyDateRange } from 'utils/date'

export interface DayHeadersProps {
  testId?: string
  isoDate: string
}

const useStyles = makeStyles({
  ...fireTableStyles,
  dayHeader: {
    position: 'sticky',
    zIndex: 3,
    padding: 0,
    borderLeft: '1px solid #C4C4C4',
    borderBottom: 'none',
    textAlign: 'center'
  }
})
const DayHeaders = (props: DayHeadersProps) => {
  const { start } = getPrepWeeklyDateRange(props.isoDate)

  const classes = useStyles()
  return (
    <React.Fragment>
      {/* Non-day specific headers */}
      <TableCell colSpan={5} className={classes.spaceHeader}></TableCell>
      {range(NUM_WEEK_DAYS).map(i => (
        <TableCell
          data-testid={`day-${i}`}
          colSpan={5}
          className={classes.dayHeader}
          key={i}
        >
          {start
            .plus({ days: i })
            .toLocaleString({ weekday: 'short', month: 'short', day: '2-digit' })}
        </TableCell>
      ))}
    </React.Fragment>
  )
}

export default React.memo(DayHeaders)
