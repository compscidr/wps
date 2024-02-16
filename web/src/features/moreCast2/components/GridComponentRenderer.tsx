import React from 'react'
import { Box, Button, TextField } from '@mui/material'
import {
  GridColumnHeaderParams,
  GridRenderCellParams,
  GridValueFormatterParams,
  GridValueGetterParams,
  GridValueSetterParams
} from '@mui/x-data-grid'
import { ModelChoice, WeatherDeterminate } from 'api/moreCast2API'
import { createWeatherModelLabel, isPreviousToToday } from 'features/moreCast2/util'
import { MoreCast2Row } from 'features/moreCast2/interfaces'
import {
  GC_HEADER,
  PRECIP_HEADER,
  RH_HEADER,
  TEMP_HEADER,
  WIND_DIR_HEADER,
  WIND_SPEED_HEADER
} from 'features/moreCast2/components/ColumnDefBuilder'

export const NOT_AVAILABLE = 'N/A'
export const NOT_REPORTING = 'N/R'

export class GridComponentRenderer {
  public renderForecastHeaderWith = (params: GridColumnHeaderParams) => {
    return <Button data-testid={`${params.colDef.field}-column-header`}>{params.colDef.headerName}</Button>
  }
  public renderHeaderWith = (params: GridColumnHeaderParams) => {
    if (params.field.endsWith('_BIAS')) {
      const headerName = params.colDef.headerName || ''
      const index = headerName.indexOf('_BIAS')
      const prefix = headerName.slice(0, index)
      return (
        <div data-testid={`${params.colDef.field}-column-header`}>
          <Box sx={{ height: '1rem' }}>{prefix}</Box>
          <Box>bias</Box>
        </div>
      )
    }
    return <div data-testid={`${params.colDef.field}-column-header`}>{params.colDef.headerName}</div>
  }
  public renderCellWith = (params: Pick<GridRenderCellParams, 'formattedValue'>) => (
    <TextField sx={{ pointerEvents: 'none' }} disabled={true} size="small" value={params.formattedValue}></TextField>
  )

  public getActualField = (field: string) => {
    const actualField = field.replace('Forecast', 'Actual')
    return actualField
  }

  public rowContainsActual = (row: MoreCast2Row): boolean => {
    for (const key in row) {
      if (key.includes(WeatherDeterminate.ACTUAL)) {
        const value = row[key as keyof MoreCast2Row]
        if (typeof value === 'number' && !isNaN(value)) {
          return true
        }
      }
    }
    return false
  }

  public valueGetter = (
    params: Pick<GridValueGetterParams, 'row' | 'value'>,
    precision: number,
    field: string,
    headerName: string
  ): string => {
    // The grass curing column is the only column that shows both actuals and forecast in a single column
    if (field.includes('grass')) {
      const actualField = this.getActualField(field)
      const actual = params.row[actualField]

      if (!isNaN(actual)) {
        return Number(actual).toFixed(precision)
      }
    }

    const value = params?.value?.value ?? params.value
    // The 'Actual' column will show N/R for Not Reporting, instead of N/A
    const noDataField = headerName === WeatherDeterminate.ACTUAL ? NOT_REPORTING : NOT_AVAILABLE

    const isPreviousDate = isPreviousToToday(params.row['forDate'])
    const isForecastColumn = this.isForecastColumn(headerName)
    const rowContainsActual = this.rowContainsActual(params.row)

    // If a cell has no value, belongs to a Forecast column, is a future forDate, and the row doesn't contain any Actuals from today,
    // we can leave it blank, so it's obvious that it can have a value entered into it.
    if (isNaN(value) && !isPreviousDate && isForecastColumn && !rowContainsActual) {
      return ''
    } else return isNaN(value) ? noDataField : value.toFixed(precision)
  }

  public renderForecastCellWith = (params: Pick<GridRenderCellParams, 'row' | 'formattedValue'>, field: string) => {
    // If a single cell in a row contains an Actual, no Forecast will be entered into the row anymore, so we can disable the whole row.
    const isActual = this.rowContainsActual(params.row)
    // We can disable a cell if an Actual exists or the forDate is before today.
    // Both forDate and today are currently in the system's time zone
    const isPreviousDate = isPreviousToToday(params.row['forDate'])

    const isGrassField = field.includes('grass')

    return (
      <TextField
        disabled={isActual || isPreviousDate}
        size="small"
        label={isGrassField ? '' : createWeatherModelLabel(params.row[field].choice)}
        InputLabelProps={{
          shrink: true
        }}
        value={params.formattedValue}
      ></TextField>
    )
  }

  public predictionItemValueSetter = (
    params: Pick<GridValueSetterParams, 'row' | 'value'>,
    field: string,
    precision: number
  ) => {
    const oldValue = params.row[field].value
    const newValue = params.value ? Number(params.value) : NaN

    if (isNaN(oldValue) && isNaN(newValue)) {
      return { ...params.row }
    }
    // Check if the user has edited the value. If so, update the value and choice to reflect the Manual edit.
    if (newValue.toFixed(precision) !== Number(params.row[field].value).toFixed(precision)) {
      params.row[field].choice = ModelChoice.MANUAL
      params.row[field].value = newValue
    }

    return { ...params.row }
  }

  public isForecastColumn = (headerName: string): boolean => {
    const forecastColumns = [
      WeatherDeterminate.FORECAST,
      TEMP_HEADER,
      RH_HEADER,
      WIND_DIR_HEADER,
      WIND_SPEED_HEADER,
      PRECIP_HEADER,
      GC_HEADER
    ]

    return forecastColumns.some(column => column === headerName)
  }

  public predictionItemValueFormatter = (params: Pick<GridValueFormatterParams, 'value'>, precision: number) => {
    const value = Number.parseFloat(params?.value)

    return isNaN(value) ? params.value : value.toFixed(precision)
  }
}
