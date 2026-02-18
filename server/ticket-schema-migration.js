/*
  File: server/ticket-schema-migration.js
  Purpose: Database schema migrations for enhanced ticket management
  
  Enhancements:
  1. SLA tracking fields (response time, resolution time)
  2. Event ticket refund/cancellation tracking
  3. Ticket waitlist for events
  4. Advanced analytics tables
  5. Performance indexes
  
  Usage: node ticket-schema-migration.js
*/

const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'huzz_auth',
  port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

async function runMigrations() {
  const connection = await pool.getConnection();
  
  const migrations = [
    // 1. Add SLA & analytics fields to support_tickets
    {
      name: 'Add SLA fields to support_tickets',
      sql: `ALTER TABLE support_tickets 
ADD COLUMN sla_response_hours INT DEFAULT 24,
ADD COLUMN first_response_at TIMESTAMP NULL,
ADD COLUMN resolved_at TIMESTAMP NULL,
ADD COLUMN time_to_respond_minutes INT DEFAULT NULL,
ADD COLUMN time_to_resolve_minutes INT DEFAULT NULL,
ADD COLUMN sla_breached BOOLEAN DEFAULT FALSE`
    },
    
    // 2. Create ticket analytics table
    {
      name: 'Create ticket_analytics table',
      sql: `
        CREATE TABLE IF NOT EXISTS ticket_analytics (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ticket_id INT NOT NULL,
          status_change_from VARCHAR(50),
          status_change_to VARCHAR(50),
          changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          changed_by INT,
          FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
          FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_ticket_id (ticket_id),
          INDEX idx_changed_at (changed_at)
        )
      `
    },
    
    // 3. Create ticket assignments history table
    {
      name: 'Create ticket_assignments table',
      sql: `
        CREATE TABLE IF NOT EXISTS ticket_assignments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ticket_id INT NOT NULL,
          assigned_to INT,
          assigned_by INT,
          assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          unassigned_at TIMESTAMP NULL,
          FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
          FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_ticket_id (ticket_id),
          INDEX idx_assigned_to (assigned_to),
          INDEX idx_assigned_at (assigned_at)
        )
      `
    },
    
    // 4. Create event ticket refunds table
    {
      name: 'Create ticket_refunds table',
      sql: `
        CREATE TABLE IF NOT EXISTS ticket_refunds (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ticket_sale_id INT NOT NULL,
          refund_reason VARCHAR(255),
          refund_amount DECIMAL(12, 2) NOT NULL,
          refund_status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
          requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          processed_at TIMESTAMP NULL,
          processed_by INT,
          notes TEXT,
          FOREIGN KEY (ticket_sale_id) REFERENCES ticket_sales(id) ON DELETE CASCADE,
          FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_ticket_sale_id (ticket_sale_id),
          INDEX idx_refund_status (refund_status),
          INDEX idx_requested_at (requested_at)
        )
      `
    },
    
    // 5. Add cancellation fields to ticket_sales
    {
      name: 'Add cancellation fields to ticket_sales',
      sql: `ALTER TABLE ticket_sales
ADD COLUMN cancelled_at TIMESTAMP NULL,
ADD COLUMN cancellation_reason VARCHAR(255),
ADD COLUMN is_refunded BOOLEAN DEFAULT FALSE`
    },
    
    // 6. Create ticket waitlist table
    {
      name: 'Create ticket_waitlist table',
      sql: `
        CREATE TABLE IF NOT EXISTS ticket_waitlist (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ticket_id INT NOT NULL,
          user_id INT NOT NULL,
          quantity INT NOT NULL,
          position INT,
          requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          notified_at TIMESTAMP NULL,
          purchased BOOLEAN DEFAULT FALSE,
          UNIQUE KEY unique_ticket_user (ticket_id, user_id),
          FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_ticket_id (ticket_id),
          INDEX idx_notified (notified_at),
          INDEX idx_position (position)
        )
      `
    },
    
    // 7. Create event ticket analytics table
    {
      name: 'Create event_ticket_analytics table',
      sql: `
        CREATE TABLE IF NOT EXISTS event_ticket_analytics (
          id INT AUTO_INCREMENT PRIMARY KEY,
          event_id INT NOT NULL,
          ticket_id INT NOT NULL,
          metric_date DATE NOT NULL,
          tickets_sold INT DEFAULT 0,
          revenue DECIMAL(12, 2) DEFAULT 0,
          refunds_processed INT DEFAULT 0,
          refund_amount DECIMAL(12, 2) DEFAULT 0,
          qr_validations INT DEFAULT 0,
          waitlist_count INT DEFAULT 0,
          UNIQUE KEY unique_event_ticket_date (event_id, ticket_id, metric_date),
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
          FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
          INDEX idx_metric_date (metric_date),
          INDEX idx_event_id (event_id)
        )
      `
    },
    
    // 8. Create support ticket resolution time tracking table
    {
      name: 'Create ticket_resolution_metrics table',
      sql: `
        CREATE TABLE IF NOT EXISTS ticket_resolution_metrics (
          id INT AUTO_INCREMENT PRIMARY KEY,
          metric_date DATE NOT NULL,
          total_tickets INT DEFAULT 0,
          tickets_open INT DEFAULT 0,
          tickets_in_progress INT DEFAULT 0,
          tickets_resolved INT DEFAULT 0,
          tickets_closed INT DEFAULT 0,
          avg_resolution_hours DECIMAL(10, 2),
          avg_response_hours DECIMAL(10, 2),
          sla_breached_count INT DEFAULT 0,
          sla_compliance_rate DECIMAL(5, 2),
          UNIQUE KEY unique_date (metric_date),
          INDEX idx_metric_date (metric_date)
        )
      `
    },
    
    // 9. Add QR validation tracking to ticket_sales
    {
      name: 'Add QR validation tracking to ticket_sales',
      sql: `ALTER TABLE ticket_sales
ADD COLUMN validated_at TIMESTAMP NULL,
ADD COLUMN validated_by INT,
ADD COLUMN validation_attempts INT DEFAULT 0`
    },
    
    // 10. Create comprehensive indexes for performance
    {
      name: 'Add performance indexes',
      sql: `CREATE INDEX idx_support_tickets_created ON support_tickets(created_at);
CREATE INDEX idx_support_tickets_status_updated ON support_tickets(status, updated_at);
CREATE INDEX idx_ticket_sales_status_created ON ticket_sales(status, created_at);
CREATE INDEX idx_tickets_event_created ON tickets(event_id, created_at)`
    },
    
    // 11. Add foreign key for ticket_sales.validated_by
    {
      name: 'Add foreign key for ticket_sales.validated_by',
      sql: `ALTER TABLE ticket_sales ADD CONSTRAINT fk_ticket_sales_validated_by FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL`
    }
  ];

  try {
    console.log('🔄 Starting ticket management schema migrations...\n');
    
    for (const migration of migrations) {
      try {
        console.log(`Applying: ${migration.name}`);
        
        // Split statements by semicolon and execute each separately
        const statements = migration.sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s && s.length > 0);
        
        for (const statement of statements) {
          try {
            await connection.execute(statement);
          } catch (err) {
            // Skip duplicate column/key errors - indicates already applied
            if (err.code && (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_DUP_ENTRY')) {
              continue;
            }
            throw err;
          }
        }
        
        console.log(`✅ ${migration.name}\n`);
      } catch (error) {
        // Log error but continue - some migrations may already exist
        if (error.code && (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_DUP_ENTRY')) {
          console.log(`⚠️  ${migration.name} (already applied)\n`);
        } else {
          console.error(`❌ ${migration.name}:`, error.message, '\n');
        }
      }
    }
    
    console.log('🎉 Ticket management schema migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    connection.release();
    await pool.end();
  }
}

// Run migrations
runMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
