import React from 'react'
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import { styled, useTheme } from '@mui/material/styles'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import FireZoneUnitInfo from 'features/fba/components/infoPanel/FireZoneUnitInfo'
import { groupBy } from 'lodash'
import { FireShapeAreaDetail } from 'api/fbaAPI'
import { INFO_PANEL_CONTENT_BACKGORUND } from 'app/theme'

interface FireCentreInfoProps {
  advisoryThreshold: number
  fireCentreName: string
  fireZoneUnitInfos: FireShapeAreaDetail[]
}

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  backgroundColor: INFO_PANEL_CONTENT_BACKGORUND,
  flexDirection: 'row-reverse',
  fontWeight: 'bold',
  margin: '0px',
  minHeight: theme.spacing(4),
  ['& . .MuiButtonBase-root.MuiAccordionSummary-root']: {
    minHeight: theme.spacing(4)
  }
}))

const FireCenterInfo = ({ advisoryThreshold, fireCentreName, fireZoneUnitInfos }: FireCentreInfoProps) => {
  const theme = useTheme()
  const groupedFireZoneUnitInfos = groupBy(fireZoneUnitInfos, 'fire_shape_name')
  return (
    <Accordion
      data-testid={`fire-centre-info`}
      disableGutters
      defaultExpanded={false}
      elevation={0}
      sx={{ marginLeft: theme.spacing(2) }}
    >
      <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>{fireCentreName}</StyledAccordionSummary>
      <AccordionDetails
        sx={{
          backgroundColor: INFO_PANEL_CONTENT_BACKGORUND,
          padding: '0',
          paddingLeft: theme.spacing(2),
          paddingRight: theme.spacing(2)
        }}
      >
        {Object.keys(groupedFireZoneUnitInfos)
          .sort((a, b) => a.localeCompare(b))
          .map(key => {
            return (
              <FireZoneUnitInfo
                key={key}
                advisoryThreshold={advisoryThreshold}
                fireZoneUnitName={key}
                fireZoneUnitDetails={groupedFireZoneUnitInfos[key]}
              />
            )
          })}
      </AccordionDetails>
    </Accordion>
  )
}

export default FireCenterInfo
