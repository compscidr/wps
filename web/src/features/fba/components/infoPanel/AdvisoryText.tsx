import { Box, Typography } from '@mui/material'
import { FireCenter, FireShapeAreaDetail } from 'api/fbaAPI'
import { DateTime } from 'luxon'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectProvincialSummary } from 'features/fba/slices/provincialSummarySlice'
import { AdvisoryStatus } from 'utils/constants'
import { groupBy } from 'lodash'
import { calculateStatusText } from '@/features/fba/calculateZoneStatus'

interface AdvisoryTextProps {
  issueDate: DateTime | null
  forDate: DateTime
  selectedFireCenter?: FireCenter
  advisoryThreshold: number
}

const AdvisoryText = ({ issueDate, forDate, advisoryThreshold, selectedFireCenter }: AdvisoryTextProps) => {
  const provincialSummary = useSelector(selectProvincialSummary)

  const getZoneStatusMap = (fireZoneUnitDetails: Record<string, FireShapeAreaDetail[]>) => {
    const zoneStatusMap: Record<AdvisoryStatus, string[]> = {
      [AdvisoryStatus.ADVISORY]: [],
      [AdvisoryStatus.WARNING]: []
    }

    for (const zoneUnit in fireZoneUnitDetails) {
      const fireShapeAreaDetails: FireShapeAreaDetail[] = fireZoneUnitDetails[zoneUnit]
      const status = calculateStatusText(fireShapeAreaDetails, advisoryThreshold)

      if (status) {
        zoneStatusMap[status].push(zoneUnit)
      }
    }

    return zoneStatusMap
  }

  const renderDefaultMessage = () => {
    return (
      <>
        {issueDate?.isValid ? (
          <Typography data-testid="default-message">Please select a fire center.</Typography>
        ) : (
          <Typography data-testid="no-data-message">No advisory data available for today.</Typography>
        )}{' '}
      </>
    )
  }

  const renderAdvisoryText = () => {
    const forToday = issueDate?.toISODate() === forDate.toISODate()
    const displayForDate = forToday ? 'today' : forDate.toLocaleString({ month: 'short', day: 'numeric' })

    const fireCenterSummary = provincialSummary[selectedFireCenter!.name]
    const groupedFireZoneUnitInfos = groupBy(fireCenterSummary, 'fire_shape_name')
    const zoneStatusMap = getZoneStatusMap(groupedFireZoneUnitInfos)

    return (
      <>
        {issueDate?.isValid && (
          <Typography
            sx={{ whiteSpace: 'pre-wrap' }}
          >{`Issued on ${issueDate?.toLocaleString(DateTime.DATE_MED)} for ${displayForDate}.\n\n`}</Typography>
        )}
        {zoneStatusMap[AdvisoryStatus.WARNING].length > 0 && (
          <>
            <Typography data-testid="advisory-message-warning">{`There is a fire behaviour ${AdvisoryStatus.WARNING} in effect in the following areas:`}</Typography>
            <ul>
              {zoneStatusMap[AdvisoryStatus.WARNING].map(zone => (
                <li key={zone}>
                  <Typography>{zone}</Typography>
                </li>
              ))}
            </ul>
          </>
        )}
        {zoneStatusMap[AdvisoryStatus.ADVISORY].length > 0 && (
          <>
            <Typography data-testid="advisory-message-advisory">{`There is a fire behaviour ${AdvisoryStatus.ADVISORY} in effect in the following areas:`}</Typography>
            <ul>
              {zoneStatusMap[AdvisoryStatus.ADVISORY].map(zone => (
                <li key={zone}>
                  <Typography>{zone}</Typography>
                </li>
              ))}
            </ul>
          </>
        )}
        {zoneStatusMap[AdvisoryStatus.WARNING].length === 0 && zoneStatusMap[AdvisoryStatus.ADVISORY].length === 0 && (
          <Typography data-testid="no-advisory-message">
            No advisories or warnings issued for the selected fire center.
          </Typography>
        )}
      </>
    )
  }

  return (
    <div data-testid="advisory-text">
      <Box
        sx={{
          height: 350,
          maxWidth: '100%',
          overflow: 'auto',
          border: '1px solid #ccc',
          padding: 2,
          borderRadius: 1,
          backgroundColor: 'white'
        }}
      >
        {!selectedFireCenter || !issueDate?.isValid ? renderDefaultMessage() : renderAdvisoryText()}
      </Box>
    </div>
  )
}

export default AdvisoryText
