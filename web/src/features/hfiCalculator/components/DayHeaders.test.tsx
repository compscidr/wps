import { Table, TableBody, TableContainer, TableRow } from '@material-ui/core'
import { render } from '@testing-library/react'
import React from 'react'
import DayHeaders from 'features/hfiCalculator/components/DayHeaders'
import { DateTime } from 'luxon'
import { range } from 'lodash'
import { NUM_WEEK_DAYS } from 'features/hfiCalculator/constants'

const prepCycleIteration = (prepDay: DateTime, isoDate: DateTime) => {
  const { getByTestId } = render(
    <TableContainer>
      <Table>
        <TableBody>
          <TableRow>
            <DayHeaders
              isoDate={isoDate.toISO()}
              numPrepDays={NUM_WEEK_DAYS}
            ></DayHeaders>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  )

  range(NUM_WEEK_DAYS).forEach(i => {
    const cell = getByTestId(`day-${i}`)
    expect(cell.className).toMatch(/makeStyles-dayHeader-/)
    expect(cell.innerHTML).toEqual(
      prepDay
        .plus({ days: i })
        .toLocaleString({ weekday: 'short', month: 'short', day: '2-digit' })
    )
  })
}

describe('DayHeaders', () => {
  it('should return table row with the headers for Monday - Friday given the ISO Date', () => {
    const isoDate = DateTime.now()
      .setZone('UTC-7')
      .set({ day: 5, month: 10, year: 2021 })
      .startOf('day')
      .toUTC()

    const prepDay = DateTime.now()
      .setZone('UTC-7')
      .set({ day: 4, month: 10, year: 2021 })
      .startOf('day')

    prepCycleIteration(prepDay, isoDate)
  })
  it('should return table row with the headers for Thursday - Monday given the ISO Date', () => {
    const isoDate = DateTime.now()
      .setZone('UTC-7')
      .set({ day: 8, month: 10, year: 2021 })
      .startOf('day')
      .toUTC()

    const prepDay = DateTime.now()
      .setZone('UTC-7')
      .set({ day: 7, month: 10, year: 2021 })
      .startOf('day')

    prepCycleIteration(prepDay, isoDate)
  })
})
