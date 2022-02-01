import { FireCentre, PlanningArea } from 'api/hfiCalcAPI'
import { StationDaily } from 'api/hfiCalculatorAPI'
import { isNull, isUndefined, range, sortBy, take, zip } from 'lodash'
import * as CSV from 'csv-string'
import { dailyTableColumnLabels } from 'features/hfiCalculator/components/DailyViewTable'
import {
  columnLabelsForEachDayInWeek,
  weeklyTableColumnLabels
} from 'features/hfiCalculator/components/WeeklyViewTable'
import { isValidGrassCure } from 'features/hfiCalculator/validation'
import { DECIMAL_PLACES } from 'features/hfiCalculator/constants'
import { PlanningAreaResult } from 'features/hfiCalculator/slices/hfiCalculatorSlice'
import { DateTime } from 'luxon'

// padding for station-data cells (e.g., station name, fuel type) before dates begin
const NUM_STATION_DATA_COLS = 5

// padding for station-specific cells (repeated daily) that will be left empty in planning area row
// (e.g., ROS, HFI)
const NUM_DAILY_DATA_COLS_THAT_DONT_APPLY_TO_AREA = 2
// padding for end-of-week cells (e.g., Highest Daily FIG, Calc. Prep)
const NUM_WEEKLY_SUMMARY_CELLS = 2

const printGrassCurePercentage = (daily: StationDaily | undefined): string => {
  if (!isUndefined(daily) && !isNull(daily.grass_cure_percentage)) {
    return daily.grass_cure_percentage.toString()
  } else {
    return 'ND'
  }
}

export class HFITableCSVFormatter {
  public static exportDailyRowsAsStrings = (
    dateOfInterest: string,
    centre: FireCentre,
    planningAreaHFIResults: {
      [key: string]: PlanningAreaResult
    }
  ): string => {
    const rowsAsStrings: string[] = []

    rowsAsStrings.push(CSV.stringify(dailyTableColumnLabels.toString()))

    rowsAsStrings.push(CSV.stringify(centre.name))
    Object.entries(centre.planning_areas)
      .sort((a, b) =>
        a[1].order_of_appearance_in_list < b[1].order_of_appearance_in_list ? -1 : 1
      )
      .forEach(([, area]) => {
        const planningAreaResult = planningAreaHFIResults[area.name]
        const areaDailyResult = planningAreaResult.dailyResults.find(
          result =>
            DateTime.fromISO(result.dateISO).weekday ===
            DateTime.fromISO(dateOfInterest).weekday
        )
        const meanIntensityGroup = areaDailyResult?.meanIntensityGroup
        const areaPrepLevel = areaDailyResult?.prepLevel
        rowsAsStrings.push(
          CSV.stringify(
            `${area.name}, ${Array(21).join(
              ','
            )} ${meanIntensityGroup}, 0-1, ${areaPrepLevel}` // fire starts of 0-1 is hard-coded for now
          )
        )
        Object.entries(area.stations).forEach(([, station]) => {
          const rowArray: string[] = []
          const daily = areaDailyResult?.dailies.find(
            areaDaily =>
              areaDaily.code === station.code &&
              areaDaily.date.weekday === DateTime.fromISO(dateOfInterest).weekday
          )

          const grassCureError = !isValidGrassCure(daily, station.station_props)

          rowArray.push(station.station_props.name + ' (' + station.code + ')')
          rowArray.push(
            isUndefined(station.station_props.elevation) ||
              isNull(station.station_props.elevation)
              ? 'ND'
              : station.station_props.elevation?.toString()
          )
          rowArray.push(station.station_props.fuel_type.abbrev)
          rowArray.push(!isUndefined(daily) ? daily.status : 'ND')
          rowArray.push(
            !isUndefined(daily) && !isUndefined(daily.temperature)
              ? daily.temperature.toFixed(DECIMAL_PLACES)
              : 'ND'
          )
          rowArray.push(
            !isUndefined(daily) && !isUndefined(daily.relative_humidity)
              ? daily.relative_humidity.toFixed(DECIMAL_PLACES)
              : 'ND'
          )
          rowArray.push(
            !isUndefined(daily) && !isNull(daily.wind_direction)
              ? daily.wind_direction.toString()
              : 'ND'
          )
          rowArray.push(
            !isUndefined(daily) && !isUndefined(daily.wind_speed)
              ? daily.wind_speed.toFixed(DECIMAL_PLACES)
              : 'ND'
          )
          rowArray.push(
            !isUndefined(daily) && !isUndefined(daily.precipitation)
              ? daily.precipitation.toFixed(DECIMAL_PLACES)
              : 'ND'
          )
          rowArray.push(grassCureError ? 'ERROR' : printGrassCurePercentage(daily))
          rowArray.push(
            !isUndefined(daily) && !isNull(daily.ffmc) ? daily.ffmc.toString() : 'ND'
          )
          rowArray.push(
            !isUndefined(daily) && !isNull(daily.dmc) ? daily.dmc.toString() : 'ND'
          )
          rowArray.push(
            !isUndefined(daily) && !isNull(daily.dc) ? daily.dc.toString() : 'ND'
          )
          rowArray.push(
            !isUndefined(daily) && !isNull(daily.isi) ? daily.isi.toString() : 'ND'
          )
          rowArray.push(
            !isUndefined(daily) && !isNull(daily.bui) ? daily.bui.toString() : 'ND'
          )
          rowArray.push(
            !isUndefined(daily) && !isNull(daily.fwi) ? daily.fwi.toString() : 'ND'
          )
          rowArray.push(
            !isUndefined(daily) && !isNull(daily.danger_class)
              ? daily.danger_class.toString()
              : 'ND'
          )
          rowArray.push(
            !isUndefined(daily) && !isUndefined(daily.rate_of_spread) && !grassCureError
              ? daily.rate_of_spread.toFixed(DECIMAL_PLACES)
              : 'ND'
          )
          rowArray.push(
            !isUndefined(daily) && !isUndefined(daily.hfi) && !grassCureError
              ? daily.hfi.toFixed(DECIMAL_PLACES)
              : 'ND'
          )
          rowArray.push(
            !isUndefined(daily) &&
              !isUndefined(daily.sixty_minute_fire_size) &&
              !grassCureError
              ? daily.sixty_minute_fire_size.toFixed(DECIMAL_PLACES)
              : 'ND'
          )
          rowArray.push(!isUndefined(daily) && !grassCureError ? daily.fire_type : 'ND')
          rowArray.push(
            !isUndefined(daily) && !grassCureError
              ? daily.intensity_group.toString()
              : 'ND'
          )

          rowsAsStrings.push(CSV.stringify(rowArray))
        })
      })

    return rowsAsStrings.join('')
  }

  static buildAreaWeeklySummaryString = (
    area: PlanningArea,
    numPrepDays: number,
    planningAreaHFIResults: {
      [key: string]: PlanningAreaResult
    }
  ): string[] => {
    const areaWeeklySummary: string[] = [
      area.name,
      ...Array(NUM_STATION_DATA_COLS - NUM_DAILY_DATA_COLS_THAT_DONT_APPLY_TO_AREA).fill(
        ' '
      )
    ]
    const planningAreaResult = planningAreaHFIResults[area.name]

    planningAreaResult.dailyResults.forEach(dailyResult => {
      const dailyIntensityGroup = dailyResult.meanIntensityGroup
      const areaDailyPrepLevel = dailyResult.prepLevel
      const fireStarts = dailyResult.fireStarts

      areaWeeklySummary.push(
        ...Array(NUM_DAILY_DATA_COLS_THAT_DONT_APPLY_TO_AREA).fill('')
      )
      areaWeeklySummary.push(
        isUndefined(dailyIntensityGroup) ? 'ND' : dailyIntensityGroup.toString()
      )
      areaWeeklySummary.push(fireStarts.label)
      areaWeeklySummary.push(
        isUndefined(areaDailyPrepLevel) ? 'ND' : areaDailyPrepLevel.toString()
      )
    })
    areaWeeklySummary.push(String(planningAreaResult.highestDailyIntensityGroup))
    areaWeeklySummary.push(
      isUndefined(planningAreaResult.meanPrepLevel)
        ? 'ND'
        : String(planningAreaResult.meanPrepLevel)
    )
    return areaWeeklySummary
  }

  public static exportWeeklyRowsAsStrings = (
    numPrepDays: number,
    startDate: DateTime,
    centre: FireCentre,
    planningAreaHFIResults: {
      [key: string]: PlanningAreaResult
    }
  ): string => {
    // build up array of string arrays, which will be converted to CSV string at end
    // each string array represents one row of table
    const rowsAsStringArrays: string[][] = []

    // build header row of dates
    const dateStrings = range(numPrepDays).map(dayOffset => {
      const date = startDate.plus({ days: dayOffset })
      return `${date.weekdayShort} ${date.monthShort} ${date.day}`
    })
    const dateRow: string[] = Array(NUM_STATION_DATA_COLS - 1).fill(' ')
    dateStrings.forEach(date => {
      dateRow.push(date)
      dateRow.push(...Array(columnLabelsForEachDayInWeek.length - 1).fill(' '))
    })
    rowsAsStringArrays.push(dateRow)

    // according to docs for csv-string library (https://www.npmjs.com/package/csv-string#api-documentation),
    // \n char should be used as newline indicator regardless of OS. Later on in code, these strings will be
    // "CSV stringified", so using /n here as line separator
    rowsAsStringArrays.push(weeklyTableColumnLabels(numPrepDays))

    rowsAsStringArrays.push([centre.name])

    Object.entries(centre.planning_areas)
      .sort((a, b) =>
        a[1].order_of_appearance_in_list < b[1].order_of_appearance_in_list ? -1 : 1
      )
      .forEach(([, area]) => {
        const planningAreaResult = planningAreaHFIResults[area.name]
        rowsAsStringArrays.push(
          this.buildAreaWeeklySummaryString(area, numPrepDays, planningAreaHFIResults)
        )

        Object.entries(area.stations).forEach(([, station]) => {
          const dailiesForStation = take(
            sortBy(
              planningAreaResult.dailyResults
                .flatMap(result => result.dailies)
                .filter(daily => daily.code === station.code),
              daily => daily.date.toMillis()
            ),
            numPrepDays
          )
          const grassCureError = !isValidGrassCure(
            dailiesForStation[0],
            station.station_props
          )

          const rowArray: string[] = []

          rowArray.push(station.station_props.name + ' (' + station.code + ')')
          if (
            isUndefined(station.station_props.elevation) ||
            isNull(station.station_props.elevation)
          ) {
            rowArray.push('ND')
          } else {
            rowArray.push(station.station_props.elevation.toString())
          }
          rowArray.push(station.station_props.fuel_type.abbrev)
          rowArray.push(
            grassCureError ? 'ERROR' : printGrassCurePercentage(dailiesForStation[0])
          )

          const rateOfSpreads = dailiesForStation.map(day =>
            isNull(day.rate_of_spread) ||
            isUndefined(day.rate_of_spread) ||
            grassCureError
              ? 'ND'
              : day.rate_of_spread.toFixed(DECIMAL_PLACES)
          )

          const hfis = dailiesForStation.map(day =>
            isNull(day.hfi) || isUndefined(day.hfi) || grassCureError
              ? 'ND'
              : day.hfi.toFixed(DECIMAL_PLACES)
          )

          const intensityGroups = dailiesForStation.map(day =>
            isNull(day.intensity_group) ||
            isUndefined(day.intensity_group) ||
            grassCureError
              ? 'ND'
              : String(day.intensity_group)
          )

          const validatedIndices = zip(rateOfSpreads, hfis, intensityGroups)
          validatedIndices.forEach(indices => {
            rowArray.push(indices[0] ? indices[0] : 'ND')
            rowArray.push(indices[1] ? indices[1] : 'ND')
            rowArray.push(indices[2] ? indices[2] : 'ND')
            rowArray.push(...Array(NUM_WEEKLY_SUMMARY_CELLS).fill(''))
          })

          rowArray.push(...Array(NUM_WEEKLY_SUMMARY_CELLS).fill(''))

          const rowString = rowArray
          rowsAsStringArrays.push(rowString)
        })
      })

    return CSV.stringify(rowsAsStringArrays)
  }
}