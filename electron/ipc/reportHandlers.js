import { reportService } from '../services/reportService.js'
import { dialog } from 'electron'
import { writeFileSync } from 'fs'

export function registerReportHandlers(ipcMain) {
  ipcMain.handle('reports:summary', (_event, from, to, filters) => {
    return reportService.summary(from, to, filters)
  })

  ipcMain.handle('reports:exportCsv', async (_event, from, to) => {
    const csv = reportService.exportCsv(from, to)

    const { filePath, canceled } = await dialog.showSaveDialog({
      defaultPath: `kronos-report-${from}-${to}.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    })

    if (canceled || !filePath) return { success: false }

    writeFileSync(filePath, csv, 'utf8')
    return { success: true, filePath }
  })
}
