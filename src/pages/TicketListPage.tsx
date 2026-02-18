import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
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
  CircularProgress,
  Pagination,
  FormControl,
  InputLabel,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import api from '../api.js'
import DashboardSidebar from '../components/DashboardSidebar'
import FilterListIcon from '@mui/icons-material/FilterList'

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
  time_to_respond_minutes?: number
  time_to_resolve_minutes?: number
  sla_breached?: boolean
}

const TicketListPage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterStatus, setFilterStatus] = useState('open')
  const [filterPriority, setFilterPriority] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      navigate('/sign-in')
      return
    }

    fetchTickets()
  }, [page, filterStatus, filterPriority, searchTerm, startDate, endDate, sortBy, navigate])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        sortBy,
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
      alert('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  const handleResetFilters = () => {
    setFilterStatus('open')
    setFilterPriority('')
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setSortBy('created_at')
    setPage(1)
  }

  const handleViewTicket = (ticketId: number) => {
    navigate(`/support/${ticketId}`)
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

  const formatMinutes = (minutes: number | undefined) => {
    if (!minutes) return 'N/A'
    if (minutes < 60) return `${minutes}m`
    return `${Math.round(minutes / 60)}h`
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <DashboardSidebar userRole="organizer" onLogout={() => {}} />
      <Container maxWidth="lg" sx={{ py: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              My Support Tickets
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/support')}
              sx={{ mb: 2 }}
            >
              Create New Ticket
            </Button>
          </Box>

          {/* Filter Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                <FilterListIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Filters
              </Typography>
              <Button size="small" onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? 'Hide' : 'Show'}
              </Button>
            </Box>

            {showFilters && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                  <TextField
                    label="Search Tickets"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setPage(1)
                    }}
                    fullWidth
                    size="small"
                    placeholder="Subject or description"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
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
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
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
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
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
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
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
                <Grid size={{ xs: 12 }} sx={{ textAlign: 'right' }}>
                  <Button size="small" onClick={handleResetFilters}>
                    Reset Filters
                  </Button>
                </Grid>
              </Grid>
            )}
          </Paper>

          {/* Tickets Table */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : tickets.length === 0 ? (
            <Card sx={{ textAlign: 'center', py: 5 }}>
              <Typography variant="body1" color="textSecondary">
                No tickets found. Create one to get started.
              </Typography>
            </Card>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Subject</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        Status
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        Priority
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Assigned To</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        Response Time
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        Messages
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {ticket.subject}
                          </Typography>
                          {ticket.sla_breached && (
                            <Chip
                              label="SLA Breached"
                              size="small"
                              color="error"
                              variant="outlined"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={ticket.status.replace('_', ' ')}
                            size="small"
                            color={getStatusColor(ticket.status) as any}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={ticket.priority.toUpperCase()}
                            size="small"
                            sx={{
                              backgroundColor: getPriorityColor(ticket.priority),
                              color: 'white',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {ticket.assigned_to_name || 'Unassigned'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            {formatMinutes(ticket.time_to_respond_minutes)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={ticket.message_count} size="small" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleViewTicket(ticket.id)}
                          >
                            View
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
        </Container>
      </Box>
    )
  }

export default TicketListPage
