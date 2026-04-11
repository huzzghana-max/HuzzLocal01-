import React, { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'

export interface ReportOption {
  value: string
  label: string
  description?: string
}

export interface ReportFilterOption {
  label: string
  value: string
}

export interface ReportFilter {
  key: string
  label: string
  options: ReportFilterOption[]
}

export interface ReportSummaryItem {
  label: string
  value: string | number
  helper?: string
}

export interface ReportColumn {
  key: string
  label: string
}

export interface GeneratedReport {
  title: string
  subtitle?: string
  summaries: ReportSummaryItem[]
  columns: ReportColumn[]
  rows: Array<Record<string, string | number>>
  insights: string[]
}

interface DashboardReportSectionProps {
  title: string
  description: string
  reportTypes: ReportOption[]
  filters?: ReportFilter[]
  defaultReportType?: string
  hideHeader?: boolean
  buildReport: (params: {
    reportType: string
    dateFrom: string
    dateTo: string
    filters: Record<string, string>
  }) => GeneratedReport
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export const DashboardReportSection: React.FC<DashboardReportSectionProps> = ({
  title,
  description,
  reportTypes,
  filters = [],
  defaultReportType,
  hideHeader = false,
  buildReport,
}) => {
  const [reportType, setReportType] = useState(defaultReportType || reportTypes[0]?.value || '')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() =>
    filters.reduce<Record<string, string>>((acc, filter) => {
      acc[filter.key] = filter.options[0]?.value || ''
      return acc
    }, {}),
  )
  const [lastGeneratedAt, setLastGeneratedAt] = useState(() => new Date())
  const previewReport = buildReport({ reportType, dateFrom, dateTo, filters: filterValues })

  const handleGenerate = () => {
    setLastGeneratedAt(new Date())
  }

  const handleExportCsv = () => {
    const headers = previewReport.columns.map((column) => column.label)
    const csvRows = previewReport.rows.map((row) =>
      previewReport.columns
        .map((column) => {
          const rawValue = row[column.key] ?? ''
          const safeValue = String(rawValue).replaceAll('"', '""')
          return `"${safeValue}"`
        })
        .join(','),
    )
    const csv = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${previewReport.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'report'}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPdf = () => {
    const reportWindow = window.open('', '_blank', 'noopener,noreferrer,width=1000,height=800')
    if (!reportWindow) return

    const summaryHtml = previewReport.summaries
      .map(
        (item) => `
          <div style="border:1px solid #d7dde7;border-radius:12px;padding:16px;min-width:180px">
            <div style="font-size:12px;color:#5b6474;text-transform:uppercase;letter-spacing:.08em">${escapeHtml(item.label)}</div>
            <div style="font-size:28px;font-weight:700;color:#1f3f4a;margin-top:6px">${escapeHtml(String(item.value))}</div>
            <div style="font-size:12px;color:#6f7684;margin-top:6px">${escapeHtml(item.helper || '')}</div>
          </div>`,
      )
      .join('')

    const tableHeaderHtml = previewReport.columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')
    const tableRowHtml = previewReport.rows
      .map(
        (row) => `
          <tr>
            ${previewReport.columns
              .map((column) => `<td>${escapeHtml(String(row[column.key] ?? ''))}</td>`)
              .join('')}
          </tr>`,
      )
      .join('')
    const insightsHtml = previewReport.insights.map((item) => `<li>${escapeHtml(item)}</li>`).join('')

    reportWindow.document.write(`
      <html>
        <head>
          <title>${escapeHtml(previewReport.title)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #23313d; }
            h1 { margin: 0 0 8px; }
            p { color: #576273; }
            .summary-grid { display: flex; gap: 12px; flex-wrap: wrap; margin: 24px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #d7dde7; padding: 10px; text-align: left; font-size: 14px; }
            th { background: #eff4f8; }
            ul { margin-top: 12px; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(previewReport.title)}</h1>
          <p>${escapeHtml(previewReport.subtitle || description)}</p>
          <div class="summary-grid">${summaryHtml}</div>
          <h2>Details</h2>
          <table>
            <thead><tr>${tableHeaderHtml}</tr></thead>
            <tbody>${tableRowHtml}</tbody>
          </table>
          <h2>Insights</h2>
          <ul>${insightsHtml}</ul>
        </body>
      </html>
    `)
    reportWindow.document.close()
    reportWindow.focus()
    reportWindow.print()
  }

  return (
    <Paper sx={{ p: 1.5, borderRadius: 3, mb: 3, boxShadow: 'none' }}>
      {!hideHeader && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 720 }}>
              {description}
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: 'center' }}>
            <Button variant="outlined" size="small" onClick={handleExportCsv}>
              Export CSV
            </Button>
            <Button variant="contained" size="small" onClick={handleExportPdf}>
              Export PDF
            </Button>
          </Stack>
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: hideHeader ? 'space-between' : 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          mb: hideHeader ? 1.5 : 1.5,
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Last generated: {lastGeneratedAt.toLocaleString()}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          {hideHeader && (
            <Button variant="outlined" size="small" onClick={handleExportCsv}>
              Export CSV
            </Button>
          )}
          {hideHeader && (
            <Button variant="contained" size="small" onClick={handleExportPdf}>
              Export PDF
            </Button>
          )}
          <Button variant="contained" size="small" onClick={handleGenerate} sx={{ minWidth: 150 }}>
            Generate Report
          </Button>
        </Stack>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5, mb: 2.5 }}>
        <FormControl fullWidth>
          <InputLabel>Report Type</InputLabel>
          <Select value={reportType} label="Report Type" onChange={(event) => setReportType(String(event.target.value))}>
            {reportTypes.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="From"
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          fullWidth
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <TextField
          label="To"
          type="date"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
          fullWidth
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        {filters.map((filter) => (
          <FormControl key={filter.key} fullWidth>
            <InputLabel>{filter.label}</InputLabel>
            <Select
              value={filterValues[filter.key] || ''}
              label={filter.label}
              onChange={(event) =>
                setFilterValues((prev) => ({
                  ...prev,
                  [filter.key]: String(event.target.value),
                }))
              }
              size="small"
            >
              {filter.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ))}
      </Box>

      {reportTypes.find((option) => option.value === reportType)?.description && (
        <Alert severity="info" sx={{ mb: 2.5 }}>
          {reportTypes.find((option) => option.value === reportType)?.description}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5, mb: 2.5 }}>
        {previewReport.summaries.map((item) => (
          <Paper key={item.label} variant="outlined" sx={{ p: 1.5, borderRadius: 2, minHeight: 100, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {item.label}
              </Typography>
              <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, mt: 0.75, lineHeight: 1.05 }}>
                {item.value}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.75 }}>
              {item.helper || 'Live preview from current dashboard data'}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 2, mb: 2.5, overflow: 'hidden' }}>
        <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {previewReport.title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {previewReport.subtitle || description}
          </Typography>
        </Box>
        <TableContainer sx={{ maxHeight: 320 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {previewReport.columns.map((column) => (
                  <TableCell key={column.key} sx={{ fontWeight: 700, py: 1, px: 1.25 }}>
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {previewReport.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={Math.max(1, previewReport.columns.length)} sx={{ py: 1.5, px: 1.25 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No rows match the current report filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                previewReport.rows.map((row, index) => (
                  <TableRow key={`${previewReport.title}-${index}`}>
                    {previewReport.columns.map((column) => (
                      <TableCell key={column.key} sx={{ py: 1, px: 1.25 }}>
                        {row[column.key] ?? '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Key Insights
        </Typography>
        <Stack spacing={0.75}>
          {previewReport.insights.map((insight, index) => (
            <Typography key={`${insight}-${index}`} variant="body2" sx={{ color: 'text.secondary' }}>
              {index + 1}. {insight}
            </Typography>
          ))}
        </Stack>
      </Paper>
    </Paper>
  )
}
