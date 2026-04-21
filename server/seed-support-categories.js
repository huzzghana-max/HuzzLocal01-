const { getPool, initializeDatabase } = require('./db')

async function seedSupportCategories() {
  try {
    console.log('Initializing database...')
    await initializeDatabase()

    console.log('Seeding support categories...')

    const pool = getPool()
    const categories = [
      { name: 'General Inquiry', description: 'General questions and inquiries' },
      { name: 'Technical Issue', description: 'Technical problems and bugs' },
      { name: 'Billing & Payment', description: 'Payment and billing related issues' },
      { name: 'Account & Profile', description: 'Account management and profile issues' },
      { name: 'Event Management', description: 'Event creation and management support' },
      { name: 'Service Booking', description: 'Service booking and vendor related issues' },
      { name: 'Other', description: 'Other types of support requests' }
    ]

    for (const category of categories) {
      await pool.execute(
        'INSERT INTO support_categories (name, description) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = name',
        [category.name, category.description]
      )
    }

    console.log('✓ Support categories seeded successfully')
  } catch (error) {
    console.error('Error seeding support categories:', error)
  } finally {
    process.exit(0)
  }
}

seedSupportCategories()