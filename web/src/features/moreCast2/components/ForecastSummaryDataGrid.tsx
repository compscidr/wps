import React from 'react'
import { styled } from '@mui/material/styles'
import { DataGrid, GridColDef, GridEventListener } from '@mui/x-data-grid'
import { ModelChoice, ModelType } from 'api/moreCast2API'
import { MoreCast2Row } from 'features/moreCast2/interfaces'
import { LinearProgress } from '@mui/material'
import ApplyToColumnMenu from 'features/moreCast2/components/ApplyToColumnMenu'
import { DataGridColumns } from 'features/moreCast2/components/DataGridColumns'
import { getSimulatedIndicesAndStoreEditedRows } from 'features/moreCast2/slices/dataSlice'
import { AppDispatch } from 'app/store'
import { useDispatch } from 'react-redux'
import { fillStationGrassCuringForward } from 'features/moreCast2/util'

const PREFIX = 'ForecastSummaryDataGrid'

const classes = {
  root: `${PREFIX}-root`
}

const Root = styled('div')({
  [`&.${classes.root}`]: {
    display: 'flex',
    flexGrow: 1,
    height: '1px'
  }
})

interface ForecastSummaryDataGridProps {
  loading: boolean
  rows: MoreCast2Row[]
  clickedColDef: GridColDef | null
  contextMenu: {
    mouseX: number
    mouseY: number
  } | null
  updateColumnWithModel: (modelType: ModelType, colDef: GridColDef) => void
  handleColumnHeaderClick: GridEventListener<'columnHeaderClick'>
  handleClose: () => void
}

const ForecastSummaryDataGrid = ({
  loading,
  rows,
  clickedColDef,
  contextMenu,
  updateColumnWithModel,
  handleColumnHeaderClick,
  handleClose
}: ForecastSummaryDataGridProps) => {
  const dispatch: AppDispatch = useDispatch()

  const processRowUpdate = async (newRow: MoreCast2Row) => {
    const filledRows = fillStationGrassCuringForward(newRow, rows)

    dispatch(getSimulatedIndicesAndStoreEditedRows(newRow, filledRows))

    return newRow
  }

  return (
    <Root className={classes.root} data-testid={`morecast2-data-grid`}>
      <DataGrid
        slots={{
          loadingOverlay: LinearProgress
        }}
        initialState={{
          sorting: {
            sortModel: [{ field: 'stationName', sort: 'asc' }]
          }
        }}
        onColumnHeaderClick={handleColumnHeaderClick}
        loading={loading}
        columns={DataGridColumns.getSummaryColumns()}
        rows={rows}
        isCellEditable={params => params.row[params.field] !== ModelChoice.ACTUAL}
        processRowUpdate={processRowUpdate}
      />
      <ApplyToColumnMenu
        colDef={clickedColDef}
        contextMenu={contextMenu}
        handleClose={handleClose}
        updateColumnWithModel={updateColumnWithModel}
      />
    </Root>
  )
}

export default ForecastSummaryDataGrid
