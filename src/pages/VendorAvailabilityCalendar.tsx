import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import SyncIcon from '@mui/icons-material/Sync'
import api from '../api'
import DashboardSidebar from '../components/DashboardSidebar'
import { DashboardHeader, StatCard } from '../components/DashboardComponents'
import { useNavigate } from 'react-router-dom'

interface AvailabilityBlock {
  id: number
  vendor_id: number
  start_at: string
  end_at: string
  source: 'manual' | 'calendar_sync' | 'booking'
  source_ref: string | null
  status: 'active' | 'cancelled'
  notes: string | null
  created_at: string
  updated_at: string
}

const toDateInput = (d: Date) => d.toISOString().split('T')[0]

const VendorAvailabilityCalendar: React.FC = () => {
  const navigate = useNavigate()
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [fromDate, setFromDate] = useState(toDateInput(new Date()))
  const [toDate, setToDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 120)
    return toDateInput(d)
  })
  const [newBlock, setNewBlock] = useState({
    start_at: '',
    end_at: '',
    notes: '',
    source: 'manual',
  })
  const [syncSource, setSyncSource] = useState('google')
  const [syncReplace, setSyncReplace] = useState(true)
  const [syncPayload, setSyncPayload] = useState(
    JSON.stringify(
      [
        {
          start_at: new Date().toISOString(),
          end_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          external_id: 'evt_123',
          summary: 'External busy slot',
        },
      ],
      null,
      2,
    ),
  )

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })()

  const loadBlocks = async () => {
    try {
      setLoading(true)
      const response = await api.get('/vendor/availability-blocks', {
        params: {
          from: fromDate,
          to: toDate,
        },
      })
      setBlocks(Array.isArray(response.data) ? response.data : [])
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.response?.data?.message || 'Failed to load availability blocks.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user || user.role !== 'provider') {
      navigate('/signin')
      return
    }
    loadBlocks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate])

  const stats = useMemo(() => {
    const active = blocks.filter((b) => b.status === 'active')
    return {
      total: blocks.length,
      active: active.length,
      manual: active.filter((b) => b.source === 'manual').length,
      synced: active.filter((b) => b.source === 'calendar_sync').length,
    }
  }, [blocks])

  const handleCreateBlock = async () => {
    if (!newBlock.start_at || !newBlock.end_at) {
      setMessage({ type: 'error', text: 'Start and end date-time are required.' })
      return
    }
    try {
      setSaving(true)
      await api.post('/vendor/availability-blocks', {
        ...newBlock,
      })
      setMessage({ type: 'success', text: 'Availability block created.' })
      setNewBlock({ start_at: '', end_at: '', notes: '', source: 'manual' })
      await loadBlocks()
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.response?.data?.message || 'Failed to create availability block.' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelBlock = async (id: number) => {
    try {
      await api.delete(`/vendor/availability-blocks/${id}`)
      setMessage({ type: 'success', text: 'Availability block cancelled.' })
      await loadBlocks()
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.response?.data?.message || 'Failed to cancel block.' })
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      let parsedBlocks: any[] = []
      try {
        parsedBlocks = JSON.parse(syncPayload)
      } catch {
        setMessage({ type: 'error', text: 'Sync payload must be valid JSON array.' })
        return
      }
      if (!Array.isArray(parsedBlocks)) {
        setMessage({ type: 'error', text: 'Sync payload must be a JSON array of blocks.' })
        return
      }
      const response = await api.post('/vendor/availability-blocks/sync', {
        source: syncSource,
        replace: syncReplace,
        blocks: parsedBlocks,
      })
      const counts = response.data?.counts
      setMessage({
        type: 'success',
        text: `Sync complete. Created: ${counts?.created || 0}, Updated: ${counts?.updated || 0}, Skipped: ${counts?.skipped || 0}.`,
      })
      await loadBlocks()
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.response?.data?.message || 'Failed to sync external availability.' })
    } finally {
      setSyncing(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/signin')
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <DashboardSidebar
        userRole="provider"
        userName={user?.name || 'Service Provider'}
        userEmail={user?.email || ''}
        userImage={user?.profile_image || ''}
        messages={0}
        notifications={stats.active}
        onLogout={handleLogout}
      />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: { xs: 0, md: '280px' }, mt: { xs: 60, md: 0 } }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <DashboardHeader
            title="Availability Calendar"
            subtitle="Block unavailable slots, sync external busy times, and reduce booking conflicts."
            actionButton={
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadBlocks}>
                Refresh
              </Button>
            }
          />

          {message && (
            <Alert severity={message.type} sx={{ mb: 2 }}>
              {message.text}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2.2, mb: 3 }}>
            <StatCard title="Total Blocks" value={stats.total} icon={<CalendarMonthIcon />} color="primary" />
            <StatCard title="Active Blocks" value={stats.active} icon={<CalendarMonthIcon />} color="success" />
            <StatCard title="Manual Blocks" value={stats.manual} icon={<CalendarMonthIcon />} color="warning" />
            <StatCard title="Synced Blocks" value={stats.synced} icon={<SyncIcon />} color="info" />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.2, mb: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Add Block
                </Typography>
                <Stack spacing={1.5}>
                  <TextField
                    label="Start"
                    type="datetime-local"
                    InputLabelProps={{ shrink: true }}
                    value={newBlock.start_at}
                    onChange={(e) => setNewBlock((p) => ({ ...p, start_at: e.target.value }))}
                  />
                  <TextField
                    label="End"
                    type="datetime-local"
                    InputLabelProps={{ shrink: true }}
                    value={newBlock.end_at}
                    onChange={(e) => setNewBlock((p) => ({ ...p, end_at: e.target.value }))}
                  />
                  <FormControl fullWidth size="small">
                    <InputLabel id="source-label">Source</InputLabel>
                    <Select
                      labelId="source-label"
                      label="Source"
                      value={newBlock.source}
                      onChange={(e) => setNewBlock((p) => ({ ...p, source: String(e.target.value) }))}
                    >
                      <MenuItem value="manual">Manual</MenuItem>
                      <MenuItem value="calendar_sync">Calendar Sync</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Notes"
                    multiline
                    minRows={2}
                    value={newBlock.notes}
                    onChange={(e) => setNewBlock((p) => ({ ...p, notes: e.target.value }))}
                  />
                  <Button variant="contained" onClick={handleCreateBlock} disabled={saving}>
                    {saving ? 'Saving...' : 'Add Block'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  External Sync Import
                </Typography>
                <Stack spacing={1.5}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="sync-source-label">Provider</InputLabel>
                    <Select
                      labelId="sync-source-label"
                      label="Provider"
                      value={syncSource}
                      onChange={(e) => setSyncSource(String(e.target.value))}
                    >
                      <MenuItem value="google">Google Calendar</MenuItem>
                      <MenuItem value="outlook">Outlook</MenuItem>
                      <MenuItem value="apple">Apple Calendar</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Switch checked={syncReplace} onChange={(e) => setSyncReplace(e.target.checked)} />
                    <Typography variant="body2">Replace previous synced blocks</Typography>
                  </Stack>
                  <TextField
                    label="Busy Slots JSON"
                    multiline
                    minRows={6}
                    value={syncPayload}
                    onChange={(e) => setSyncPayload(e.target.value)}
                    helperText="Expected: [{ start_at, end_at, external_id?, summary? }]"
                  />
                  <Button variant="outlined" startIcon={<SyncIcon />} onClick={handleSync} disabled={syncing}>
                    {syncing ? 'Syncing...' : 'Import Busy Slots'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          <Paper sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
              <TextField
                label="From"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <TextField
                label="To"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </Stack>

            {loading ? (
              <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Start</TableCell>
                      <TableCell>End</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Notes</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {blocks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                            No availability blocks in selected range.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      blocks.map((block) => (
                        <TableRow key={block.id} hover>
                          <TableCell>{new Date(block.start_at).toLocaleString()}</TableCell>
                          <TableCell>{new Date(block.end_at).toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={block.source === 'calendar_sync' ? 'synced' : block.source}
                              color={block.source === 'calendar_sync' ? 'info' : block.source === 'booking' ? 'secondary' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={block.status} color={block.status === 'active' ? 'success' : 'default'} />
                          </TableCell>
                          <TableCell>{block.notes || '-'}</TableCell>
                          <TableCell align="right">
                            {block.status === 'active' ? (
                              <Button
                                size="small"
                                color="error"
                                startIcon={<DeleteOutlineIcon />}
                                onClick={() => handleCancelBlock(block.id)}
                              >
                                Cancel
                              </Button>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Container>
      </Box>
    </Box>
  )
}

export default VendorAvailabilityCalendar
