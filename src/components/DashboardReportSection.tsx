import React, { useState } from 'react'
import {
  Alert,
  Box,
  Button,
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
import { alpha, useTheme } from '@mui/material/styles'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import html2pdf from 'html2pdf.js'

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
  appliesTo?: string[]
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
  description,
  reportTypes,
  filters = [],
  defaultReportType,
  hideHeader = false,
  buildReport,
}) => {
  const theme = useTheme()
  const [reportType, setReportType] = useState(defaultReportType || reportTypes[0]?.value || '')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() =>
    filters.reduce<Record<string, string>>((acc, filter) => {
      acc[filter.key] = filter.options[0]?.value || ''
      return acc
    }, {}),
  )
  const [appliedParams, setAppliedParams] = useState(() => ({
    reportType: defaultReportType || reportTypes[0]?.value || '',
    dateFrom: '',
    dateTo: '',
    filters: filters.reduce<Record<string, string>>((acc, filter) => {
      acc[filter.key] = filter.options[0]?.value || ''
      return acc
    }, {}),
  }))
  const [lastGeneratedAt, setLastGeneratedAt] = useState(() => new Date())

  const visibleFilters = filters.filter((filter) => !filter.appliesTo || filter.appliesTo.includes(reportType))
  const previewReport = buildReport(appliedParams)
  const activeReportType = reportTypes.find((option) => option.value === appliedParams.reportType)
  const hasInvalidDateRange = Boolean(dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo))
  const hasPendingChanges =
    reportType !== appliedParams.reportType ||
    dateFrom !== appliedParams.dateFrom ||
    dateTo !== appliedParams.dateTo ||
    filters.some((filter) => filterValues[filter.key] !== appliedParams.filters[filter.key])

  const handleGenerateReport = () => {
    if (hasInvalidDateRange) return

    setAppliedParams({
      reportType,
      dateFrom,
      dateTo,
      filters: { ...filterValues },
    })
    setLastGeneratedAt(new Date())
  }

  const resetFilters = () => {
    setDateFrom('')
    setDateTo('')
    const resetValues = filters.reduce<Record<string, string>>((acc, filter) => {
      acc[filter.key] = filter.options[0]?.value || ''
      return acc
    }, {})
    const defaultType = defaultReportType || reportTypes[0]?.value || ''

    setReportType(defaultType)
    setFilterValues(resetValues)
    setAppliedParams({
      reportType: defaultType,
      dateFrom: '',
      dateTo: '',
      filters: resetValues,
    })
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
    const summaryHtml = previewReport.summaries
      .map(
        (item) => `
          <div style="border:1px solid #d7dde7;border-radius:12px;padding:16px;min-width:180px;margin-bottom:12px;font-family:Arial,sans-serif;color:#23313d;">
            <div style="font-size:12px;color:#5b6474;text-transform:uppercase;letter-spacing:0.08em">${escapeHtml(item.label)}</div>
            <div style="font-size:28px;font-weight:700;color:#1f3f4a;margin-top:6px">${escapeHtml(String(item.value))}</div>
            <div style="font-size:12px;color:#6f7684;margin-top:6px">${escapeHtml(item.helper || '')}</div>
          </div>`,
      )
      .join('')

    const tableHeaderHtml = previewReport.columns
      .map((column) => `<th style="border:1px solid #d7dde7;padding:10px;text-align:left;font-size:14px;background:#eff4f8;font-family:Arial,sans-serif;color:#23313d;">${escapeHtml(column.label)}</th>`)
      .join('')
    const tableRowHtml = previewReport.rows
      .map(
        (row) => `
          <tr>
            ${previewReport.columns
              .map((column) => `<td style="border:1px solid #d7dde7;padding:10px;text-align:left;font-size:14px;font-family:Arial,sans-serif;color:#23313d;">${escapeHtml(String(row[column.key] ?? ''))}</td>`)
              .join('')}
          </tr>`,
      )
      .join('')
    const insightsHtml = previewReport.insights
      .map((item) => `<li style="margin-bottom:8px;font-family:Arial,sans-serif;color:#23313d;">${escapeHtml(item)}</li>`)
      .join('')

    const htmlContent = `
      <div style="font-family:Arial,sans-serif;padding:32px;color:#23313d;">
        <h1 style="margin:0 0 8px 0;font-family:Arial,sans-serif;color:#23313d;">${escapeHtml(previewReport.title)}</h1>
        <p style="color:#576273;font-family:Arial,sans-serif;margin:0 0 24px 0;">${escapeHtml(previewReport.subtitle || description)}</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin:24px 0;">${summaryHtml}</div>
        <h2 style="font-family:Arial,sans-serif;color:#23313d;margin:20px 0 0 0;">Details</h2>
        <table style="width:100%;border-collapse:collapse;margin-top:20px;font-family:Arial,sans-serif;color:#23313d;">
          <thead><tr>${tableHeaderHtml}</tr></thead>
          <tbody>${tableRowHtml}</tbody>
        </table>
        <h2 style="font-family:Arial,sans-serif;color:#23313d;margin:12px 0 0 0;">Insights</h2>
        <ul style="margin-top:12px;font-family:Arial,sans-serif;color:#23313d;">${insightsHtml}</ul>
      </div>
    `

    const element = document.createElement('div')
    element.innerHTML = htmlContent
    element.style.position = 'absolute'
    element.style.left = '-9999px'
    element.style.top = '0'
    element.style.width = '800px'
    document.body.appendChild(element)

    const opt = {
      margin: 1,
      filename: `${previewReport.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'report'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, width: 800 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const },
    }

    html2pdf().set(opt).from(element).save().then(() => {
      document.body.removeChild(element)
    })
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Paper
        sx={{
          p: { xs: 1.5, md: 2 },
          mb: 1.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
        }}
      >
        <Stack spacing={1.5}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              flexDirection: { xs: 'column', md: 'row' },
              gap: 1.5,
            }}
          >
            <Box>
              {!hideHeader && (
                <Typography sx={{ fontSize: { xs: '1.2rem', md: '1.4rem' }, fontWeight: 800, color: 'text.primary' }}>
                  {previewReport.title}
                </Typography>
              )}
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, maxWidth: 720 }}>
                {activeReportType?.description || previewReport.subtitle || description}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.75 }}>
                Last generated: {lastGeneratedAt.toLocaleString()}
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
              <Button
                variant="contained"
                onClick={handleGenerateReport}
                fullWidth
                size="small"
                disabled={hasInvalidDateRange || !hasPendingChanges}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, minHeight: 36 }}
              >
                Generate Report
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadRoundedIcon />}
                onClick={handleExportCsv}
                fullWidth
                size="small"
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, minHeight: 36 }}
              >
                CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<DescriptionRoundedIcon />}
                onClick={handleExportPdf}
                fullWidth
                size="small"
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, minHeight: 36 }}
              >
                PDF
              </Button>
            </Stack>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: `minmax(220px, 1.4fr) repeat(${Math.max(2, visibleFilters.length + 2)}, minmax(160px, 1fr)) auto` },
              gap: 0.9,
            }}
          >
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={(event) => setReportType(String(event.target.value))}
                size="small"
                sx={{ borderRadius: 2 }}
              >
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
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <TextField
              label="To"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            {visibleFilters.map((filter) => (
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
                  sx={{ borderRadius: 2 }}
                >
                  {filter.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}

            <Button
              variant="text"
              startIcon={<RestartAltRoundedIcon />}
              onClick={resetFilters}
              sx={{ textTransform: 'none', fontWeight: 700, justifySelf: { lg: 'start' }, minHeight: 36 }}
            >
              Reset
            </Button>
          </Box>

          {hasInvalidDateRange && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              The end date must be on or after the start date before generating or exporting this report.
            </Alert>
          )}

          {hasPendingChanges && !hasInvalidDateRange && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              The preview below still shows the last generated snapshot. Select Generate Report to apply your latest filters.
            </Alert>
          )}
        </Stack>
      </Paper>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
          gap: 1,
          mb: 1.5,
        }}
      >
        {previewReport.summaries.map((item) => (
          <Paper
            key={item.label}
            sx={{
              p: 1.25,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
            }}
          >
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {item.label}
            </Typography>
            <Typography sx={{ fontSize: '1.45rem', fontWeight: 800, mt: 0.6, color: 'text.primary' }}>
              {item.value}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.6, display: 'block' }}>
              {item.helper || 'Live preview from current filters'}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Paper
        sx={{
          mb: 1.5,
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
        }}
      >
        <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>Preview</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {previewReport.subtitle || description}
          </Typography>
          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.9), display: 'block', mt: 0.6 }}>
            {previewReport.rows.length} rows - {previewReport.columns.length} columns
          </Typography>
        </Box>

        <TableContainer sx={{ maxHeight: 420 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {previewReport.columns.map((column) => (
                  <TableCell
                    key={column.key}
                    sx={{
                      fontWeight: 700,
                      py: 0.9,
                      px: 1.2,
                      bgcolor: theme.palette.background.paper,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {previewReport.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={Math.max(1, previewReport.columns.length)} sx={{ py: 2.4, px: 1.2 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No rows match the current report filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                previewReport.rows.map((row, index) => (
                  <TableRow key={`${previewReport.title}-${index}`}>
                    {previewReport.columns.map((column) => (
                      <TableCell key={column.key} sx={{ py: 0.9, px: 1.2 }}>
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

      <Paper
        sx={{
          p: 1.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
        }}
      >
        <Typography sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>Key insights</Typography>
        <Stack spacing={0.75}>
          {previewReport.insights.map((insight, index) => (
            <Typography key={`${insight}-${index}`} variant="body2" sx={{ color: 'text.secondary' }}>
              {index + 1}. {insight}
            </Typography>
          ))}
        </Stack>
      </Paper>
    </Box>
  )
}
