import React, { useEffect, useState } from 'react'
import { Box, Container, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress } from '@mui/material'
import api from '../api'

const AdminTicketReports: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [sales, setSales] = useState<any[]>([])

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const resp = await api.get('/admin/ticket-sales')
      setSales(resp.data || [])
    } catch (err) {
      console.error('Failed to fetch sales', err)
      alert('Failed to load sales')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Ticket Sales Report</Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <Paper>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>Ticket</TableCell>
                  <TableCell>Buyer</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Validated</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sales.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{s.id}</TableCell>
                    <TableCell>{s.event_name} ({s.event_id})</TableCell>
                    <TableCell>{s.ticket_type}</TableCell>
                    <TableCell>{s.buyer_name} • {s.buyer_email}</TableCell>
                    <TableCell>{s.quantity}</TableCell>
                    <TableCell>${s.amount}</TableCell>
                    <TableCell>{s.validated ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{new Date(s.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Container>
    </Box>
  )
}

export default AdminTicketReports
