import axios from 'api/axios'
import { Station } from 'api/stationAPI'
import { isEqual } from 'lodash'
import { DateTime } from 'luxon'
import { MoreCast2ForecastRow } from 'features/moreCast2/interfaces'

export enum ModelChoice {
  FORECAST = 'FORECAST',
  GDPS = 'GDPS',
  GFS = 'GFS',
  HRDPS = 'HRDPS',
  NAM = 'NAM',
  RDPS = 'RDPS',
  MANUAL = 'MANUAL',
  PERSISTENCE = 'PERSISTENCE',
  ACTUAL = 'ACTUAL',
  NULL = 'NULL'
}

export const DEFAULT_MODEL_TYPE: ModelType = ModelChoice.HRDPS

export type ModelType =
  | 'HRDPS'
  | 'GDPS'
  | 'GFS'
  | 'PERSISTENCE'
  | 'NAM'
  | 'RDPS'
  | 'MANUAL'
  | 'FORECAST'
  | 'ACTUAL'
  | 'NULL'

export const ModelChoices: ModelType[] = [
  ModelChoice.GDPS,
  ModelChoice.GFS,
  ModelChoice.HRDPS,
  ModelChoice.PERSISTENCE,
  ModelChoice.MANUAL,
  ModelChoice.NAM,
  ModelChoice.NULL,
  ModelChoice.RDPS
]

export const WeatherModelChoices: ModelType[] = [
  ModelChoice.GDPS,
  ModelChoice.GFS,
  ModelChoice.HRDPS,
  ModelChoice.NAM,
  ModelChoice.RDPS
]

export enum WeatherDeterminate {
  ACTUAL = 'Actual',
  FORECAST = 'Forecast',
  GDPS = 'GDPS',
  GFS = 'GFS',
  HRDPS = 'HRDPS',
  NAM = 'NAM',
  NULL = 'NULL',
  RDPS = 'RDPS'
}

export type WeatherDeterminateType = 'Actual' | 'Forecast' | 'GDPS' | 'GFS' | 'HRDPS' | 'NAM' | 'NULL' | 'RDPS'

export const WeatherDeterminateChoices = [
  WeatherDeterminate.ACTUAL,
  WeatherDeterminate.FORECAST,
  WeatherDeterminate.GDPS,
  WeatherDeterminate.GFS,
  WeatherDeterminate.HRDPS,
  WeatherDeterminate.NAM,
  WeatherDeterminate.NULL,
  WeatherDeterminate.RDPS
]

export interface WeatherIndeterminate {
  id: string
  station_code: number
  station_name: string
  determinate: WeatherDeterminateType
  utc_timestamp: string
  precipitation: number | null
  relative_humidity: number | null
  temperature: number | null
  wind_direction: number | null
  wind_speed: number | null
}

export interface WeatherIndeterminatePayload {
  actuals: WeatherIndeterminate[]
  forecasts: WeatherIndeterminate[]
  predictions: WeatherIndeterminate[]
}

export interface WeatherIndeterminateResponse {
  actuals: WeatherIndeterminate[]
  forecasts: MoreCast2ForecastRecord[]
  predictions: WeatherIndeterminate[]
}

export interface StationPrediction {
  abbreviation: ModelType
  bias_adjusted_relative_humidity: number | null
  bias_adjusted_temperature: number | null
  datetime: string
  precip_24hours: number | null
  id: string
  relative_humidity: number | null
  station: Station
  temperature: number | null
  wind_direction: number | null
  wind_speed: number | null
}

export const ModelOptions: ModelType[] = ModelChoices.filter(choice => !isEqual(choice, ModelChoice.MANUAL))

export interface MoreCast2ForecastRecord {
  station_code: number
  for_date: number
  temp: number
  rh: number
  precip: number
  wind_speed: number
  wind_direction: number
  update_timestamp?: number
  station_name?: string
}

export const marshalMoreCast2ForecastRecords = (forecasts: MoreCast2ForecastRow[]) => {
  const forecastRecords: MoreCast2ForecastRecord[] = forecasts.map(forecast => {
    return {
      station_code: forecast.stationCode,
      for_date: forecast.forDate.toMillis(),
      precip: forecast.precip.value,
      rh: forecast.rh.value,
      temp: forecast.temp.value,
      wind_direction: forecast.windDirection.value,
      wind_speed: forecast.windSpeed.value
    }
  })
  return forecastRecords
}

/**
 * POSTs a batch of forecasts.
 * @param forecasts The raw forecast model data.
 * @returns True if the response is a 201, otherwise false.
 */
export async function submitMoreCastForecastRecords(forecasts: MoreCast2ForecastRow[]): Promise<boolean> {
  const forecastRecords = marshalMoreCast2ForecastRecords(forecasts)
  const url = `/morecast-v2/forecast`
  try {
    const { status } = await axios.post<MoreCast2ForecastRecord[]>(url, {
      forecasts: forecastRecords
    })
    return status === 201
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(error.message || error)
    return false
  }
}

export async function fetchWeatherIndeterminates(
  stationCodes: number[],
  startDate: DateTime,
  endDate: DateTime
): Promise<WeatherIndeterminatePayload> {
  if (stationCodes.length === 0) {
    return {
      actuals: [],
      forecasts: [],
      predictions: []
    }
  }
  const url = `/morecast-v2/determinates/${startDate.toISODate()}/${endDate.toISODate()}`
  const { data } = await axios.post<WeatherIndeterminateResponse>(url, {
    stations: stationCodes
  })
  const payload: WeatherIndeterminatePayload = {
    actuals: data.actuals,
    forecasts: marshallForecastsToWeatherIndeterminates(data.forecasts),
    predictions: data.predictions
  }

  return payload
}

const marshallForecastsToWeatherIndeterminates = (forecasts: MoreCast2ForecastRecord[]) => {
  if (!forecasts.length) {
    return []
  }
  const forecastsAsWeatherIndeterminates: WeatherIndeterminate[] = []
  for (const forecast of forecasts) {
    let dateString = DateTime.fromMillis(forecast.for_date).toISODate()
    dateString = `${dateString}T20:00:00+00:00`
    const weatherIndeterminate: WeatherIndeterminate = {
      id: '',
      station_code: forecast.station_code,
      station_name: forecast.station_name || '',
      determinate: WeatherDeterminate.FORECAST,
      utc_timestamp: dateString,
      precipitation: forecast.precip,
      relative_humidity: forecast.rh,
      temperature: forecast.temp,
      wind_direction: forecast.wind_direction,
      wind_speed: forecast.wind_speed
    }
    forecastsAsWeatherIndeterminates.push(weatherIndeterminate)
  }
  return forecastsAsWeatherIndeterminates
}
