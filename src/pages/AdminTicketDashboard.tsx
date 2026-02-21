import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Pagination,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
} from '@mui/material'
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import api from '../api.js'
import DashboardSidebar from '../components/DashboardSidebar'

interface Ticket {
  id: number
  subject: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string
  user_name: string
  assigned_to_name?: string
  created_at: string
  updated_at: string
  message_count: number
}

interface AnalyticsData {
  metrics: {
    total_tickets: number
    open_tickets: number
    in_progress_tickets: number
    resolved_tickets: number
    closed_tickets: number
    urgent_count: number
    high_count: number
    medium_count: number
    low_count: number
    sla_breached_count: number
    avg_response_time: number
    avg_resolution_time: number
  }
  statusTrend: any[]
  resolutionDistribution: any[]
}

const AdminTicketDashboard: React.FC = () => {
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      return {}
    }
  })()
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [assignDialog, setAssignDialog] = useState(false)
  const [escalateDialog, setEscalateDialog] = useState(false)
  const [assignTo, setAssignTo] = useState('')
  const [escalateNotes, setEscalateNotes] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  useEffect(() => {
    fetchAnalytics()
    fetchTickets()
  }, [page, filterStatus, filterPriority, searchTerm, startDate, endDate])

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await api.get(`/support/analytics/dashboard?${params}`)
      setAnalytics(response.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })

      if (filterStatus) params.append('status', filterStatus)
      if (filterPriority) params.append('priority', filterPriority)
      if (searchTerm) params.append('search', searchTerm)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await api.get(`/support/tickets/search?${params}`)
      setTickets(response.data.tickets)
      setTotalPages(response.data.pagination.pages)
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignTicket = async () => {
    if (!selectedTicket || !assignTo) return

    try {
      await api.post(`/support/tickets/${selectedTicket.id}/assign`, {
        assigned_to: assignTo,
      })
      setAssignDialog(false)
      setAssignTo('')
      fetchTickets()
      alert('Ticket assigned successfully')
    } catch (error) {
      console.error('Failed to assign ticket:', error)
      alert('Failed to assign ticket')
    }
  }

  const handleEscalateTicket = async () => {
    if (!selectedTicket) return

    try {
      await api.post(`/support/tickets/${selectedTicket.id}/escalate`, {
        notes: escalateNotes,
      })
      setEscalateDialog(false)
      setEscalateNotes('')
      fetchTickets()
      fetchAnalytics()
      alert('Ticket escalated successfully')
    } catch (error) {
      console.error('Failed to escalate ticket:', error)
      alert('Failed to escalate ticket')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'error'
      case 'in_progress':
        return 'warning'
      case 'resolved':
        return 'info'
      case 'closed':
        return 'success'
      default:
        return 'default'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#FF0000'
      case 'high':
        return '#ff9800'
      case 'medium':
        return '#2196f3'
      case 'low':
        return '#4caf50'
      default:
        return '#999'
    }
  }

  const getSLAStatus = () => {
    if (!analytics?.metrics) return 'N/A'
    const total = analytics.metrics.total_tickets
    if (total === 0) return 'N/A'
    const compliance = ((total - analytics.metrics.sla_breached_count) / total) * 100
    return `${compliance.toFixed(1)}%`
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <DashboardSidebar
        userRole="admin"
        userName={currentUser?.name || 'Admin User'}
        userEmail={currentUser?.email || 'admin@huzz.com'}
        userImage={currentUser?.profile_image}
        onLogout={() => {}}
      />
      <Container maxWidth="lg" sx={{ py: 4, width: '100%' }}>
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
          Admin Ticket Dashboard
        </Typography>

        {/* Summary Cards */}
        {analytics && (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Tickets
                  </Typography>
                  <Typography variant="h5">{analytics.metrics.total_tickets}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Open
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#f44336' }}>
                    {analytics.metrics.open_tickets}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    In Progress
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#ff9800' }}>
                    {analytics.metrics.in_progress_tickets}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    SLA Breached
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#f44336' }}>
                    {analytics.metrics.sla_breached_count}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    SLA Compliance
                  </Typography>
                  <Typography variant="h5">{getSLAStatus()}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <Tabs value={activeTab} onChange={(_e, newValue) => setActiveTab(newValue)}>
          <Tab label="Analytics" />
          <Tab label="Ticket List" />
          <Tab label="Metrics" />
        </Tabs>

        {/* Analytics Tab */}
        {activeTab === 0 && analytics && (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Tickets by Priority
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Urgent', value: analytics.metrics.urgent_count },
                          { name: 'High', value: analytics.metrics.high_count },
                          { name: 'Medium', value: analytics.metrics.medium_count },
                          { name: 'Low', value: analytics.metrics.low_count },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }: { name?: string; value?: number }) => `${name || 'Unknown'}: ${value || 0}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Tickets by Status
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Open', value: analytics.metrics.open_tickets },
                          { name: 'In Progress', value: analytics.metrics.in_progress_tickets },
                          { name: 'Resolved', value: analytics.metrics.resolved_tickets },
                          { name: 'Closed', value: analytics.metrics.closed_tickets },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }: { name?: string; value?: number }) => `${name || 'Unknown'}: ${value || 0}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Resolution Time Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.resolutionDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="resolution_bucket" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Ticket List Tab */}
        {activeTab === 1 && (
          <Box sx={{ mt: 3 }}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Search"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setPage(1)
                    }}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      label="Status"
                      onChange={(e) => {
                        setFilterStatus(e.target.value)
                        setPage(1)
                      }}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="open">Open</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="resolved">Resolved</MenuItem>
                      <MenuItem value="closed">Closed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={filterPriority}
                      label="Priority"
                      onChange={(e) => {
                        setFilterPriority(e.target.value)
                        setPage(1)
                      }}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="low">Low</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      setPage(1)
                    }}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                  <TextField
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value)
                      setPage(1)
                    }}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
            </Paper>

            {loading ? (
              <CircularProgress />
            ) : (
              <>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell>Subject</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>Assigned To</TableCell>
                        <TableCell>Messages</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <TableRow key={ticket.id} hover>
                          <TableCell>{ticket.subject}</TableCell>
                          <TableCell>
                            <Chip
                              label={ticket.priority.toUpperCase()}
                              size="small"
                              sx={{ backgroundColor: getPriorityColor(ticket.priority), color: 'white' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={ticket.status}
                              size="small"
                              color={getStatusColor(ticket.status) as any}
                            />
                          </TableCell>
                          <TableCell>{ticket.user_name}</TableCell>
                          <TableCell>{ticket.assigned_to_name || '-'}</TableCell>
                          <TableCell>{ticket.message_count}</TableCell>
                          <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              onClick={() => {
                                setSelectedTicket(ticket)
                                setAssignDialog(true)
                              }}
                            >
                              Assign
                            </Button>
                            <Button
                              size="small"
                              color="warning"
                              onClick={() => {
                                setSelectedTicket(ticket)
                                setEscalateDialog(true)
                              }}
                            >
                              Escalate
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_e, newPage) => setPage(newPage)}
                  />
                </Box>
              </>
            )}
          </Box>
        )}

        {/* Metrics Tab */}
        {activeTab === 2 && analytics && (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Response Time
                    </Typography>
                    <Typography variant="h4">
                      {Math.round(analytics.metrics.avg_response_time || 0)} mins
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Average response time to first message
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Resolution Time
                    </Typography>
                    <Typography variant="h4">
                      {Math.round(analytics.metrics.avg_resolution_time || 0)} mins
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Average time to resolve tickets
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Assign Dialog */}
        <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Assign Ticket</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              Ticket: {selectedTicket?.subject}
            </Typography>
            <TextField
              label="Assign To (User ID)"
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              fullWidth
              type="number"
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignDialog(false)}>Cancel</Button>
            <Button onClick={handleAssignTicket} variant="contained">
              Assign
            </Button>
          </DialogActions>
        </Dialog>

        {/* Escalate Dialog */}
        <Dialog open={escalateDialog} onClose={() => setEscalateDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Escalate Ticket</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              Ticket: {selectedTicket?.subject}
            </Typography>
            <TextField
              label="Escalation Notes"
              value={escalateNotes}
              onChange={(e) => setEscalateNotes(e.target.value)}
              fullWidth
              multiline
              rows={4}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEscalateDialog(false)}>Cancel</Button>
            <Button onClick={handleEscalateTicket} variant="contained" color="warning">
              Escalate
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  )
}

export default AdminTicketDashboard
