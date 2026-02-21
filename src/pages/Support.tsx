import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Tabs,
  Tab,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import api from '../api.js'
import DashboardSidebar from '../components/DashboardSidebar'
import HelpIcon from '@mui/icons-material/Help'
import TicketIcon from '@mui/icons-material/Assignment'
import ChatIcon from '@mui/icons-material/Chat'
import SearchIcon from '@mui/icons-material/Search'
import { InputAdornment } from '@mui/material'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`support-tabpanel-${index}`}
      aria-labelledby={`support-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

interface Ticket {
  id: number
  subject: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string
  created_at: string
  updated_at: string
}

interface FAQ {
  id: number
  category: string
  question: string
  answer: string
  views: number
  helpful_count: number
}

interface Category {
  id: number
  name: string
  description: string
}

const Support: React.FC = () => {
  const navigate = useNavigate()
  const [tabValue, setTabValue] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Tickets
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [openTicketDialog, setOpenTicketDialog] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [newTicket, setNewTicket] = useState({
    category_id: '',
    subject: '',
    description: '',
    priority: 'medium',
  })

  // FAQs
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [faqCategories, setFaqCategories] = useState<string[]>([])
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<string>('')
  const [searchFaq, setSearchFaq] = useState('')

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    } else {
      navigate('/sign-in')
      return
    }

    fetchTickets()
    fetchCategories()
    fetchFaqs()
    fetchFaqCategories()
  }, [navigate])

  const fetchTickets = async () => {
    try {
      const response = await api.get('/support/tickets')
      setTickets(response.data)
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/support/categories')
      setCategories(response.data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchFaqs = async () => {
    try {
      const response = await api.get('/faqs', {
        params: selectedFaqCategory ? { category: selectedFaqCategory } : {},
      })
      setFaqs(response.data)
    } catch (error) {
      console.error('Failed to fetch FAQs:', error)
    }
  }

  const fetchFaqCategories = async () => {
    try {
      const response = await api.get('/faqs/categories')
      setFaqCategories(response.data)
    } catch (error) {
      console.error('Failed to fetch FAQ categories:', error)
    }
  }

  const handleCreateTicket = async () => {
    if (!newTicket.category_id || !newTicket.subject || !newTicket.description) {
      alert('Please fill all required fields')
      return
    }

    try {
      setLoading(true)
      await api.post('/support/tickets', {
        category_id: newTicket.category_id,
        subject: newTicket.subject,
        description: newTicket.description,
        priority: newTicket.priority,
      })

      alert('Ticket created successfully!')
      setNewTicket({ category_id: '', subject: '', description: '', priority: 'medium' })
      setOpenTicketDialog(false)
      fetchTickets()
    } catch (error) {
      console.error('Failed to create ticket:', error)
      alert('Failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  const handleViewTicket = (ticketId: number) => {
    navigate(`/support/tickets/${ticketId}`)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
      open: 'info',
      in_progress: 'warning',
      resolved: 'success',
      closed: 'default',
    }
    return colors[status] || 'default'
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info'> = {
      low: 'info',
      medium: 'warning',
      high: 'error',
      urgent: 'error',
    }
    return colors[priority] || 'default'
  }

  const filteredFaqs = faqs.filter(
    faq =>
      faq.question.toLowerCase().includes(searchFaq.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchFaq.toLowerCase())
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      {user && (
        <DashboardSidebar
          userRole={user.role}
          userName={user.name}
          userEmail={user.email}
          userImage={user.profile_image}
          messages={0}
          onLogout={() => {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            navigate('/signin')
          }}
        />
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: { xs: 0, md: '280px' }, mt: { xs: 60, md: 0 } }}>
        <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
              Support Center
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Get help, manage support tickets, or explore our knowledge base
            </Typography>
          </Box>

          {/* Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              aria-label="support tabs"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab icon={<TicketIcon />} iconPosition="start" label="My Tickets" id="support-tab-0" aria-controls="support-tabpanel-0" />
              <Tab icon={<ChatIcon />} iconPosition="start" label="Live Chat" id="support-tab-1" aria-controls="support-tabpanel-1" />
              <Tab icon={<HelpIcon />} iconPosition="start" label="FAQ & Help" id="support-tab-2" aria-controls="support-tabpanel-2" />
            </Tabs>
          </Paper>

          {/* Tab Panels */}

          {/* My Tickets Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setOpenTicketDialog(true)}
                sx={{ mb: 2 }}
              >
                Create New Ticket
              </Button>

              {tickets.length === 0 ? (
                <Alert severity="info">No support tickets yet. Create one to get started!</Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {tickets.map(ticket => (
                    <Box key={ticket.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' },
                        }}
                        onClick={() => handleViewTicket(ticket.id)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {ticket.subject}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                Ticket ID: #{ticket.id} • Category: {ticket.category}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Chip label={ticket.status} color={getStatusColor(ticket.status)} size="small" />
                              <Chip label={ticket.priority} color={getPriorityColor(ticket.priority)} size="small" />
                            </Box>
                          </Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Created: {new Date(ticket.created_at).toLocaleDateString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </TabPanel>

          {/* Live Chat Tab */}
          <TabPanel value={tabValue} index={1}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <ChatIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                Live Chat Support
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Our support team is available 24/7 to help you
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Live chat feature will be available soon. In the meantime, create a support ticket or check our FAQ.
              </Typography>
              <Button variant="contained" onClick={() => setTabValue(0)}>
                Create Support Ticket
              </Button>
            </Paper>
          </TabPanel>

          {/* FAQ & Help Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ mb: 4 }}>
              {/* Search */}
              <TextField
                fullWidth
                placeholder="Search FAQs..."
                value={searchFaq}
                onChange={e => setSearchFaq(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              {/* Category Filter */}
              <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant={selectedFaqCategory === '' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => {
                    setSelectedFaqCategory('')
                    fetchFaqs()
                  }}
                >
                  All
                </Button>
                {faqCategories.map(category => (
                  <Button
                    key={category}
                    variant={selectedFaqCategory === category ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setSelectedFaqCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </Box>

              {/* FAQs List */}
              {loading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : filteredFaqs.length === 0 ? (
                <Alert severity="info">No FAQs found. Try a different search.</Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {filteredFaqs.map(faq => (
                    <Box key={faq.id}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {faq.question}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                            {faq.answer}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', gap: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
                              <span>📊 {faq.views} views</span>
                              <span>👍 {faq.helpful_count} found helpful</span>
                            </Box>
                            <Button size="small" color="primary">
                              This was helpful
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </TabPanel>
        </Container>
      </Box>

      {/* Create Ticket Dialog */}
      <Dialog open={openTicketDialog} onClose={() => setOpenTicketDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Support Ticket</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            select
            label="Category *"
            value={newTicket.category_id}
            onChange={e => setNewTicket({ ...newTicket, category_id: e.target.value })}
            fullWidth
          >
            {categories.map(cat => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Subject *"
            value={newTicket.subject}
            onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })}
            fullWidth
            placeholder="Brief description of your issue"
          />

          <TextField
            label="Description *"
            value={newTicket.description}
            onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
            fullWidth
            multiline
            rows={4}
            placeholder="Provide detailed information about your issue"
          />

          <TextField
            select
            label="Priority"
            value={newTicket.priority}
            onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}
            fullWidth
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="urgent">Urgent</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTicketDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateTicket} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Create Ticket'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Support
