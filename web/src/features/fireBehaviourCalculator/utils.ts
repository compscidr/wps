import assert from 'assert'
import _ from 'lodash'
import { isNull } from 'lodash'
import { FBCInputRow } from './components/FBCInputGrid'

export const isGrassFuelType = (fuelType: string) =>
  fuelType === 'o1a' || fuelType === 'o1b'
export const isValidFuelSetting = (
  fuelType: string,
  grassCurePercentage: number | null
) => {
  if (isGrassFuelType(fuelType)) {
    return !isNull(grassCurePercentage)
  }
  return true
}
/**
 * Extracts search params from url and marshalls them into rows for the fire behaviour calculator
 * @param searchParams Form is ?rows=s=<station-code>&f=<fuel-type>&c=<grass-cure-percentage>,...
 * @returns
 */
export const getRowsFromUrlParams = (searchParams: string): FBCInputRow[] => {
  const buildRow = (params: string[]) => {
    // station, fuel type, grass cure %
    assert(params.length === 3)

    const rowToBuild = { weatherStation: '1', fuelType: 'c1', grassCure: 0 }
    params.forEach(param => {
      const keyValPair = param.replace('?', '').split('=')
      assert(keyValPair.length === 2)
      switch (keyValPair[0]) {
        case 's':
          rowToBuild.weatherStation = keyValPair[1]
          break
        case 'f':
          rowToBuild.fuelType = keyValPair[1]
          break
        case 'c':
          rowToBuild.grassCure = parseInt(keyValPair[1])
          break
        default:
          // No op
          break
      }
    })
    return rowToBuild
  }
  const rows = searchParams.split(',').map((param, index) => {
    const individualParams = param.split('&')
    const builtRow = buildRow(individualParams)
    const rowWithId = {
      id: index,
      weatherStation: builtRow.weatherStation,
      fuelType: builtRow.fuelType,
      grassCure: builtRow.grassCure
    }
    console.log(rowWithId)
    return rowWithId
  })
  console.log(rows)
  return rows
}

export const getMostRecentIdFromRows = (rows: FBCInputRow[]): number => {
  let lastIdFromExisting = _.maxBy(rows, 'id')?.id
  lastIdFromExisting = lastIdFromExisting ? lastIdFromExisting : 0
  const lastId = _.isEmpty(rows) ? 0 : lastIdFromExisting
  console.log(lastId)
  return lastId
}
