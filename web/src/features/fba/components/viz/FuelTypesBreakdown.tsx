import React from 'react'
import { styled } from '@mui/material/styles'
import { Typography } from '@mui/material'
import { isUndefined } from 'lodash'
import { FireShape, FireZoneThresholdFuelTypeArea } from 'api/fbaAPI'
import { PieChart, Pie, ResponsiveContainer, Cell } from 'recharts'

const PREFIX = 'FuelTypesBreakdown'

const FuelTypesHeader = styled(Typography, {
  name: `${PREFIX}-fuelTypesHeader`
})({
  fontSize: '1.3rem',
  textAlign: 'center',
  variant: 'h3'
})

const PieChartHeader = styled(Typography, {
  name: `${PREFIX}-pieChartHeader`
})({
  fontSize: '1rem',
  textAlign: 'center',
  variant: 'h4'
})

interface Props {
  className?: string
  selectedFireZone: FireShape | undefined
  fuelTypeInfo: Record<number, FireZoneThresholdFuelTypeArea[]>
}

interface FuelTypeDataForPieChart {
  area: number
  fuel_type_code: string
}

const RADIAN = Math.PI / 180
const COLOURS = [
  '#2191FB',
  '#FCB1A6',
  '#B33951',
  '#CCF5AC',
  '#8CDEDC',
  '#9DACFF',
  '#4F7CAC',
  '#FFA62B',
  '#C09BD8',
  '#EBC3DB',
  '#D19C1D',
  '#FFC0BE',
  '#ED7D3A'
]

const FuelTypesBreakdown = (props: Props) => {
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    fuel_type_code,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    area,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    index
  }: {
    cx: number
    cy: number
    midAngle: number
    innerRadius: number
    outerRadius: number
    percent: number
    fuel_type_code: string
    area: number
    index: number
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percent * 100 < 2) {
      return
    }

    return (
      <text x={x} y={y} fontSize={'10pt'} fill="black" textAnchor={x > cx ? 'start' : 'end'}>
        {`${fuel_type_code} (${(percent * 100).toFixed(0)}%)`}
      </text>
    )
  }

  if (isUndefined(props.selectedFireZone) || isUndefined(props.fuelTypeInfo[props.selectedFireZone.fire_shape_id])) {
    return <div></div>
  } else {
    const advisories: FuelTypeDataForPieChart[] = []
    const warnings: FuelTypeDataForPieChart[] = []
    props.fuelTypeInfo[props.selectedFireZone?.fire_shape_id].forEach(record => {
      if (record.threshold.id === 1) {
        advisories.push({ area: record.area, fuel_type_code: record.fuel_type.fuel_type_code })
      } else if (record.threshold.id === 2) {
        warnings.push({ area: record.area, fuel_type_code: record.fuel_type.fuel_type_code })
      }
    })
    return (
      <div>
        <FuelTypesHeader>HFI by Fuel Type</FuelTypesHeader>
        <PieChartHeader>Advisories (HFI: 4,000-10,000 kW/m)</PieChartHeader>
        <ResponsiveContainer width={400} height={250}>
          <PieChart>
            <Pie
              data={advisories}
              dataKey={'area'}
              nameKey={'fuel_type_code'}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              labelLine={false}
              label={renderCustomizedLabel}
            >
              {advisories.map((entry, index) => (
                <Cell key={`cell-${entry.fuel_type_code}`} fill={COLOURS[index % COLOURS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <PieChartHeader>Warnings (HFI: +10,000 kW/m)</PieChartHeader>
        <ResponsiveContainer width={400} height={250}>
          <PieChart>
            <Pie
              data={warnings}
              dataKey={'area'}
              nameKey={'fuel_type_code'}
              cx="50%"
              cy="50%"
              outerRadius={80}
              labelLine={false}
              label={renderCustomizedLabel}
            >
              {warnings.map((entry, index) => (
                <Cell key={`cell-${entry.fuel_type_code}`} fill={COLOURS[index % COLOURS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }
}

export default React.memo(FuelTypesBreakdown)
