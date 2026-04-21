/*
  File: server/ticket-management-routes.js
  Purpose: Advanced ticket management API endpoints
  
  Features:
  - Analytics and metrics reporting
  - Advanced filtering and search
  - Admin dashboard ticket management
  - SLA tracking and compliance
  - Event ticket QR validation and refunds
  - Batch operations
  
  Usage: Import and mount in server.js
*/

module.exports = function(app, { getPoolOrThrow, verifyToken, isAdmin }) {
  
  // ============================================================================
  // SUPPORT TICKET ANALYTICS
  // ============================================================================
  
  // Get ticket analytics dashboard for admin
  app.get('/api/support/analytics/dashboard', verifyToken, async (req, res) => {
    try {
      const user = req.user;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const pool = getPoolOrThrow();
      const { startDate, endDate } = req.query;
      
      let dateFilter = '';
      const params = [];
      
      if (startDate && endDate) {
        dateFilter = ' AND DATE(st.created_at) BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }
      
      // Get comprehensive metrics
      const [metrics] = await pool.execute(`
        SELECT 
          COUNT(*) as total_tickets,
          SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_tickets,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tickets,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_tickets,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_tickets,
          SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent_count,
          SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_count,
          SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as medium_count,
          SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as low_count,
          SUM(CASE WHEN sla_breached = TRUE THEN 1 ELSE 0 END) as sla_breached_count,
          AVG(time_to_respond_minutes) as avg_response_time,
          AVG(time_to_resolve_minutes) as avg_resolution_time,
          MIN(created_at) as first_ticket_date,
          MAX(updated_at) as last_ticket_date
        FROM support_tickets st
        WHERE 1=1 ${dateFilter}
      `, params);
      
      // Get tickets by status over time
      const [statusTrend] = await pool.execute(`
        SELECT 
          DATE(created_at) as date,
          status,
          COUNT(*) as count
        FROM support_tickets
        WHERE 1=1 ${dateFilter}
        GROUP BY DATE(created_at), status
        ORDER BY date DESC
      `, params);
      
      // Get resolution time distribution
      const [resolutionDistribution] = await pool.execute(`
        SELECT 
          CASE 
            WHEN time_to_resolve_minutes <= 60 THEN '< 1 hour'
            WHEN time_to_resolve_minutes <= 240 THEN '1-4 hours'
            WHEN time_to_resolve_minutes <= 1440 THEN '4-24 hours'
            WHEN time_to_resolve_minutes <= 7200 THEN '1-3 days'
            ELSE '> 3 days'
          END as resolution_bucket,
          COUNT(*) as count
        FROM support_tickets
        WHERE resolved_at IS NOT NULL AND 1=1 ${dateFilter}
        GROUP BY resolution_bucket
      `, params);
      
      res.json({
        metrics: metrics[0],
        statusTrend,
        resolutionDistribution
      });
    } catch (error) {
      console.error('Analytics error:', error.message);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get ticket list with advanced filtering
  app.get('/api/support/tickets/search', verifyToken, async (req, res) => {
    try {
      const user = req.user;
      const pool = getPoolOrThrow();
      
      const {
        status,
        priority,
        category_id,
        assigned_to,
        search,
        startDate,
        endDate,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        page = 1,
        limit = 20
      } = req.query;
      
      let whereClause = '';
      const params = [];
      
      // Admin sees all, users see their own
      if (user.role !== 'admin') {
        whereClause = 'WHERE st.user_id = ?';
        params.push(user.id);
      }
      
      // Apply filters
      if (status) {
        whereClause += whereClause ? ' AND' : 'WHERE';
        whereClause += ` st.status = ?`;
        params.push(status);
      }
      
      if (priority) {
        whereClause += whereClause ? ' AND' : 'WHERE';
        whereClause += ` st.priority = ?`;
        params.push(priority);
      }
      
      if (category_id) {
        whereClause += whereClause ? ' AND' : 'WHERE';
        whereClause += ` st.category_id = ?`;
        params.push(category_id);
      }
      
      if (assigned_to && user.role === 'admin') {
        whereClause += whereClause ? ' AND' : 'WHERE';
        whereClause += ` st.assigned_to = ?`;
        params.push(assigned_to);
      }
      
      if (search) {
        whereClause += whereClause ? ' AND' : 'WHERE';
        whereClause += ` (st.subject LIKE ? OR st.description LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }
      
      if (startDate && endDate) {
        whereClause += whereClause ? ' AND' : 'WHERE';
        whereClause += ` DATE(st.created_at) BETWEEN ? AND ?`;
        params.push(startDate, endDate);
      }
      
      // Validate sortBy
      const allowedSortFields = ['created_at', 'updated_at', 'priority', 'status'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
      const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      const pageNumber = Math.max(1, parseInt(page, 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      
      // Get total count
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM support_tickets st ${whereClause}`,
        params
      );
      
      const total = countResult[0].total;
      const offset = (pageNumber - 1) * pageSize;
      
      // Get paginated results
      const [tickets] = await pool.execute(`
        SELECT st.id, st.subject, st.status, st.priority, st.created_at, st.updated_at,
               st.time_to_respond_minutes, st.time_to_resolve_minutes, st.sla_breached,
               c.name as category, u.name as user_name, a.name as assigned_to_name,
               (SELECT COUNT(*) FROM support_messages WHERE ticket_id = st.id) as message_count
        FROM support_tickets st
        LEFT JOIN support_categories c ON st.category_id = c.id
        LEFT JOIN users u ON st.user_id = u.id
        LEFT JOIN users a ON st.assigned_to = a.id
        ${whereClause}
        ORDER BY st.${sortField} ${order}
        LIMIT ${pageSize} OFFSET ${offset}
      `, params);
      
      res.json({
        tickets,
        pagination: {
          page: pageNumber,
          limit: pageSize,
          total,
          pages: Math.ceil(total / pageSize)
        }
      });
    } catch (error) {
      console.error('Search error:', error.message);
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================================================
  // ADMIN TICKET MANAGEMENT
  // ============================================================================

  // Get available staff members for ticket assignment
  app.get('/api/support/staff', verifyToken, async (req, res) => {
    try {
      const user = req.user;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const pool = getPoolOrThrow();
      const [staff] = await pool.execute(`
        SELECT id, name, email FROM users 
        WHERE role IN ('admin', 'provider') 
        ORDER BY name ASC
      `);

      res.json(staff);
    } catch (error) {
      console.error('Staff list error:', error.message);
      res.status(500).json({ message: error.message });
    }
  });

  // Get a single ticket with conversation for admin review
  app.get('/api/admin/support/tickets/:ticketId', verifyToken, async (req, res) => {
    try {
      const user = req.user;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { ticketId } = req.params;
      const pool = getPoolOrThrow();

      const [tickets] = await pool.execute(`
        SELECT st.id, st.subject, st.description, st.status, st.priority, st.created_at, st.updated_at,
               st.time_to_respond_minutes, st.time_to_resolve_minutes, st.sla_breached,
               c.name as category, u.name as user_name, u.email as user_email, a.name as assigned_to_name
        FROM support_tickets st
        LEFT JOIN support_categories c ON st.category_id = c.id
        LEFT JOIN users u ON st.user_id = u.id
        LEFT JOIN users a ON st.assigned_to = a.id
        WHERE st.id = ?
        LIMIT 1
      `, [ticketId]);

      if (tickets.length === 0) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      const [messages] = await pool.execute(`
        SELECT m.id, m.message, m.created_at, m.attachment_path,
               u.id as user_id, u.name, u.role
        FROM support_messages m
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.ticket_id = ?
        ORDER BY m.created_at ASC
      `, [ticketId]);

      res.json({
        ticket: tickets[0],
        messages,
      });
    } catch (error) {
      console.error('Admin ticket detail error:', error.message);
      res.status(500).json({ message: error.message });
    }
  });

  // Add an admin message to a support ticket
  app.post('/api/admin/support/tickets/:ticketId/messages', verifyToken, async (req, res) => {
    try {
      const user = req.user;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { ticketId } = req.params;
      const { message } = req.body;

      if (!message || !String(message).trim()) {
        return res.status(400).json({ message: 'Message content is required' });
      }

      const pool = getPoolOrThrow();
      const [tickets] = await pool.execute('SELECT id FROM support_tickets WHERE id = ? LIMIT 1', [ticketId]);

      if (tickets.length === 0) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      const [result] = await pool.execute(
        'INSERT INTO support_messages (ticket_id, user_id, message) VALUES (?, ?, ?)',
        [ticketId, user.id, String(message).trim()],
      );

      res.status(201).json({
        id: result.insertId,
        ticket_id: Number(ticketId),
        user_id: user.id,
        message: String(message).trim(),
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Admin add ticket message error:', error.message);
      res.status(500).json({ message: error.message });
    }
  });

  // Update ticket status from the admin console
  app.put('/api/admin/support/tickets/:ticketId/status', verifyToken, async (req, res) => {
    try {
      const user = req.user;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { ticketId } = req.params;
      const { status } = req.body;

      if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const pool = getPoolOrThrow();
      const [result] = await pool.execute(
        'UPDATE support_tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, ticketId],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      res.json({ message: 'Ticket status updated successfully', status });
    } catch (error) {
      console.error('Admin ticket status update error:', error.message);
      res.status(500).json({ message: error.message });
    }
  });

  // Assign ticket to staff member
  app.post('/api/support/tickets/:ticketId/assign', verifyToken, async (req, res) => {
    try {
      const user = req.user;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const { ticketId } = req.params;
      const { assigned_to } = req.body;
      const assignedToId = parseInt(assigned_to, 10);
      
      if (!assigned_to) {
        return res.status(400).json({ message: 'assigned_to is required' });
      }

      if (Number.isNaN(assignedToId) || assignedToId < 1) {
        return res.status(400).json({ message: 'assigned_to must be a valid user ID' });
      }
      
      const pool = getPoolOrThrow();

      const [assignees] = await pool.execute(
        'SELECT id FROM users WHERE id = ? LIMIT 1',
        [assignedToId],
      );

      if (assignees.length === 0) {
        return res.status(404).json({ message: 'Assigned user not found' });
      }
      
      // Record assignment history
      await pool.execute(`
        INSERT INTO ticket_assignments (ticket_id, assigned_to, assigned_by, assigned_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `, [ticketId, assignedToId, user.id]);
      
      // Update ticket
      await pool.execute(
        'UPDATE support_tickets SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [assignedToId, ticketId]
      );
      
      res.json({ message: 'Ticket assigned successfully' });
    } catch (error) {
      console.error('Assign error:', error.message);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Escalate ticket
  app.post('/api/support/tickets/:ticketId/escalate', verifyToken, async (req, res) => {
    try {
      const user = req.user;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const { ticketId } = req.params;
      const { notes } = req.body;
      
      const pool = getPoolOrThrow();
      
      // Update priority and status
      await pool.execute(`
        UPDATE support_tickets 
        SET priority = 'urgent', status = 'in_progress', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [ticketId]);
      
      // Add note as admin message
      if (notes) {
        await pool.execute(`
          INSERT INTO support_messages (ticket_id, user_id, message)
          VALUES (?, ?, ?)
        `, [ticketId, user.id, `[ESCALATION NOTE] ${notes}`]);
      }
      
      res.json({ message: 'Ticket escalated successfully' });
    } catch (error) {
      console.error('Escalate error:', error.message);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Batch update ticket status
  app.post('/api/support/tickets/batch/status-update', verifyToken, async (req, res) => {
    try {
      const user = req.user;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const { ticketIds, status } = req.body;
      
      if (!ticketIds || ticketIds.length === 0 || !status) {
        return res.status(400).json({ message: 'ticketIds array and status are required' });
      }
      
      const pool = getPoolOrThrow();
      
      const placeholders = ticketIds.map(() => '?').join(',');
      await pool.execute(`
        UPDATE support_tickets 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id IN (${placeholders})
      `, [status, ...ticketIds]);
      
      res.json({ message: `Updated ${ticketIds.length} tickets` });
    } catch (error) {
      console.error('Batch update error:', error.message);
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================================================
  // SLA MANAGEMENT
  // ============================================================================
  
  // Check SLA compliance for tickets
  app.post('/api/support/sla/check-compliance', verifyToken, async (req, res) => {
    try {
      const user = req.user;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const pool = getPoolOrThrow();
      
      // Find tickets that need SLA checking
      const [tickets] = await pool.execute(`
        SELECT id, sla_response_hours, created_at, first_response_at, resolved_at
        FROM support_tickets
        WHERE sla_breached = FALSE AND status IN ('open', 'in_progress')
      `);
      
      let breachedCount = 0;
      
      for (const ticket of tickets) {
        const createdTime = new Date(ticket.created_at);
        const slaDeadline = new Date(createdTime.getTime() + ticket.sla_response_hours * 60 * 60 * 1000);
        const now = new Date();
        
        if (now > slaDeadline && !ticket.first_response_at) {
          // Mark as SLA breached
          await pool.execute(
            'UPDATE support_tickets SET sla_breached = TRUE WHERE id = ?',
            [ticket.id]
          );
          breachedCount++;
        }
      }
      
      res.json({
        message: `SLA check complete. ${breachedCount} tickets marked as breached.`,
        breachedCount
      });
    } catch (error) {
      console.error('SLA check error:', error.message);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get SLA report
  app.get('/api/support/sla/report', verifyToken, async (req, res) => {
    try {
      const user = req.user;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const pool = getPoolOrThrow();
      const { startDate, endDate } = req.query;
      
      let dateFilter = '';
      const params = [];
      
      if (startDate && endDate) {
        dateFilter = ' WHERE DATE(created_at) BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }
      
      const [report] = await pool.execute(`
        SELECT 
          COUNT(*) as total_closed_tickets,
          SUM(CASE WHEN sla_breached = TRUE THEN 1 ELSE 0 END) as sla_breached_count,
          ROUND(100 * (COUNT(*) - SUM(CASE WHEN sla_breached = TRUE THEN 1 ELSE 0 END)) / COUNT(*), 2) as sla_compliance_rate,
          AVG(time_to_resolve_minutes) as avg_resolution_minutes,
          AVG(time_to_respond_minutes) as avg_response_minutes
        FROM support_tickets
        WHERE status IN ('resolved', 'closed') ${dateFilter}
      `, params);
      
      res.json(report[0] || {});
    } catch (error) {
      console.error('SLA report error:', error.message);
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================================================
  // EVENT TICKET MANAGEMENT
  // ============================================================================
  
  // Validate QR code for event ticket
  app.post('/api/tickets/validate-qr', verifyToken, async (req, res) => {
    try {
      const user = req.user;
      const { qrCode } = req.body;
      
      if (!qrCode) {
        return res.status(400).json({ message: 'QR code is required' });
      }
      
      const pool = getPoolOrThrow();
      
      // Find ticket sale by QR code
      const [ticketSales] = await pool.execute(`
        SELECT ts.id, ts.ticket_id, ts.buyer_id, ts.quantity, ts.validated, 
               ts.validated_at, t.event_id, e.name as event_name
        FROM ticket_sales ts
        JOIN tickets t ON ts.ticket_id = t.id
        JOIN events e ON t.event_id = e.id
        WHERE ts.qr_code = ?
      `, [qrCode]);
      
      if (ticketSales.length === 0) {
        return res.status(404).json({ message: 'Invalid QR code' });
      }
      
      const ticketSale = ticketSales[0];
      
      if (ticketSale.validated) {
        return res.status(400).json({ message: 'Ticket already validated' });
      }
      
      // Mark as validated
      await pool.execute(`
        UPDATE ticket_sales 
        SET validated = TRUE, validated_at = CURRENT_TIMESTAMP, validated_by = ?, validation_attempts = validation_attempts + 1
        WHERE id = ?
      `, [user.id, ticketSale.id]);
      
      res.json({
        message: 'Ticket validated successfully',
        ticket: {
          id: ticketSale.id,
          eventName: ticketSale.event_name,
          quantity: ticketSale.quantity
        }
      });
    } catch (error) {
      console.error('QR validation error:', error.message);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Request ticket refund
  app.post('/api/tickets/:ticketSaleId/request-refund', verifyToken, async (req, res) => {
    try {
      const user = req.user;
      const { ticketSaleId } = req.params;
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: 'Refund reason is required' });
      }
      
      const pool = getPoolOrThrow();
      
      // Get ticket sale details
      const [ticketSales] = await pool.execute(
        'SELECT id, buyer_id, amount FROM ticket_sales WHERE id = ?',
        [ticketSaleId]
      );
      
      if (ticketSales.length === 0) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      
      const ticketSale = ticketSales[0];
      
      // Only buyer can request refund
      if (ticketSale.buyer_id !== user.id) {
        return res.status(403).json({ message: 'You cannot refund this ticket' });
      }
      
      // Create refund request
      const [result] = await pool.execute(`
        INSERT INTO ticket_refunds (ticket_sale_id, refund_reason, refund_amount, refund_status, requested_at)
        VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP)
      `, [ticketSaleId, reason, ticketSale.amount]);
      
      res.status(201).json({
        id: result.insertId,
        message: 'Refund request submitted',
        status: 'pending'
      });
    } catch (error) {
      console.error('Refund error:', error.message);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Process ticket refund (admin only)
  app.post('/api/tickets/refunds/:refundId/process', verifyToken, async (req, res) => {
    try {
      const user = req.user;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const { refundId } = req.params;
      const { approved, notes } = req.body;
      
      const pool = getPoolOrThrow();
      
      const newStatus = approved ? 'approved' : 'rejected';
      
      // Update refund status
      await pool.execute(`
        UPDATE ticket_refunds 
        SET refund_status = ?, processed_at = CURRENT_TIMESTAMP, processed_by = ?, notes = ?
        WHERE id = ?
      `, [newStatus, user.id, notes, refundId]);
      
      if (approved) {
        // Mark ticket as refunded
        const [refund] = await pool.execute(
          'SELECT ticket_sale_id FROM ticket_refunds WHERE id = ?',
          [refundId]
        );
        
        if (refund.length > 0) {
          await pool.execute(
            'UPDATE ticket_sales SET is_refunded = TRUE WHERE id = ?',
            [refund[0].ticket_sale_id]
          );
        }
      }
      
      res.json({ message: `Refund ${newStatus}` });
    } catch (error) {
      console.error('Process refund error:', error.message);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Join waitlist for event ticket
  app.post('/api/tickets/:ticketId/waitlist', verifyToken, async (req, res) => {
    try {
      const user = req.user;
      const { ticketId } = req.params;
      const { quantity } = req.body;
      
      if (!quantity || quantity < 1) {
        return res.status(400).json({ message: 'Quantity must be at least 1' });
      }
      
      const pool = getPoolOrThrow();
      
      // Get next waitlist position
      const [maxPosition] = await pool.execute(
        'SELECT MAX(position) as max_position FROM ticket_waitlist WHERE ticket_id = ?',
        [ticketId]
      );
      
      const nextPosition = (maxPosition[0].max_position || 0) + 1;
      
      // Add to waitlist
      const [result] = await pool.execute(`
        INSERT INTO ticket_waitlist (ticket_id, user_id, quantity, position, requested_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT (ticket_id, user_id)
        DO UPDATE SET position = EXCLUDED.position, quantity = EXCLUDED.quantity
      `, [ticketId, user.id, quantity, nextPosition]);
      
      res.status(201).json({
        message: 'Added to waitlist',
        position: nextPosition
      });
    } catch (error) {
      console.error('Waitlist error:', error.message);
      res.status(500).json({ message: error.message });
    }
  });
};
