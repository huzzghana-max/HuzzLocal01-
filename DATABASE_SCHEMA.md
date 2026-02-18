# Database Schema Reference

## Complete Database Structure

### Database: `huzz_auth`

---

## Table Definitions

### 1. `users`
**Purpose:** Core user account table for all system users

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('organizer', 'provider', 'admin') DEFAULT 'organizer',
  phone VARCHAR(20),
  profile_image VARCHAR(255),
  bio TEXT,
  is_approved BOOLEAN DEFAULT TRUE,
  notification_preferences JSON DEFAULT '{}',
  privacy_settings JSON DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
)
```

**Fields:**
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | INT | NO | AUTO | Unique user identifier |
| name | VARCHAR(255) | NO | - | User's full name |
| email | VARCHAR(255) | NO | UNIQUE | Login email address |
| password | VARCHAR(255) | NO | - | Bcrypted password hash |
| role | ENUM | YES | 'organizer' | User role: organizer, provider, admin |
| phone | VARCHAR(20) | YES | NULL | Contact phone number |
| profile_image | VARCHAR(255) | YES | NULL | Avatar/profile pic URL |
| bio | TEXT | YES | NULL | User biography |
| is_approved | BOOLEAN | YES | TRUE | Account approval status |
| notification_preferences | JSON | YES | {} | Notification settings |
| privacy_settings | JSON | YES | {} | Privacy configuration |
| created_at | TIMESTAMP | YES | CURRENT | Account creation timestamp |
| updated_at | TIMESTAMP | YES | CURRENT | Last update timestamp |

**Relationships:**
- One-to-one with `service_providers` (via user_id where role='provider')
- One-to-many with `events` (via organizer_id)
- One-to-many with `service_bookings` (as organizer_id or provider_id)
- One-to-many with `messages` (as sender_id or recipient_id)
- One-to-many with `images` (via user_id)

---

### 2. `service_providers`
**Purpose:** Extended profile for users who provide services

```sql
CREATE TABLE service_providers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  business_name VARCHAR(255) NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  description TEXT,
  hourly_rate DECIMAL(10, 2),
  min_booking_hours INT DEFAULT 1,
  availability_status ENUM('available', 'unavailable') DEFAULT 'available',
  rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INT DEFAULT 0,
  profile_image VARCHAR(255),
  portfolio_images JSON,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_service_type (service_type),
  INDEX idx_rating (rating)
)
```

**Fields:**
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | INT | NO | AUTO | Provider identifier |
| user_id | INT | NO | UNIQUE | Foreign key to users table |
| business_name | VARCHAR(255) | NO | - | Service business name |
| service_type | VARCHAR(100) | NO | - | Type of service offered |
| description | TEXT | YES | NULL | Business description |
| hourly_rate | DECIMAL(10,2) | YES | NULL | Price per hour |
| min_booking_hours | INT | YES | 1 | Minimum booking hours |
| availability_status | ENUM | YES | 'available' | Current availability |
| rating | DECIMAL(3,2) | YES | 0 | Average rating (0-5) |
| total_ratings | INT | YES | 0 | Number of ratings |
| profile_image | VARCHAR(255) | YES | NULL | Business logo/image |
| portfolio_images | JSON | YES | NULL | Array of portfolio images |
| location | VARCHAR(255) | YES | NULL | Service location |
| created_at | TIMESTAMP | YES | CURRENT | Profile creation time |
| updated_at | TIMESTAMP | YES | CURRENT | Last update time |

**Relationships:**
- Many-to-one with `users` (via user_id)
- One-to-many with `services` (via provider_id)

---

### 3. `services`
**Purpose:** Individual services offered by providers

```sql
CREATE TABLE services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(255),
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE CASCADE,
  INDEX idx_provider_id (provider_id),
  INDEX idx_category (category)
)
```

**Fields:**
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | INT | NO | AUTO | Service identifier |
| provider_id | INT | NO | - | FK to service_providers |
| name | VARCHAR(255) | NO | - | Service name |
| description | TEXT | YES | NULL | Service description |
| price | DECIMAL(10,2) | NO | - | Service price |
| image_url | VARCHAR(255) | YES | NULL | Service image |
| category | VARCHAR(100) | YES | NULL | Service category |
| is_active | BOOLEAN | YES | TRUE | Service availability |
| created_at | TIMESTAMP | YES | CURRENT | Creation time |
| updated_at | TIMESTAMP | YES | CURRENT | Last update time |

**Relationships:**
- Many-to-one with `service_providers` (via provider_id)
- One-to-many with `service_bookings` (via service_id)

---

### 4. `events`
**Purpose:** Events created by organizers

```sql
CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organizer_id INT NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATETIME,
  location VARCHAR(255),
  event_type VARCHAR(100),
  status ENUM('planning', 'scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'planning',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_organizer_id (organizer_id),
  INDEX idx_event_date (event_date)
)
```

**Fields:**
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | INT | NO | AUTO | Event identifier |
| organizer_id | INT | NO | - | FK to users (organizer) |
| event_name | VARCHAR(255) | NO | - | Event title |
| description | TEXT | YES | NULL | Event description |
| event_date | DATETIME | YES | NULL | When event occurs |
| location | VARCHAR(255) | YES | NULL | Event location |
| event_type | VARCHAR(100) | YES | NULL | Type of event |
| status | ENUM | YES | 'planning' | Event status |
| created_at | TIMESTAMP | YES | CURRENT | Creation time |
| updated_at | TIMESTAMP | YES | CURRENT | Last update time |

**Status Values:** `planning`, `scheduled`, `ongoing`, `completed`, `cancelled`

**Relationships:**
- Many-to-one with `users` (via organizer_id)

---

### 5. `service_bookings`
**Purpose:** Booking transactions between organizers and providers

```sql
CREATE TABLE service_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organizer_id INT NOT NULL,
  provider_id INT NOT NULL,
  service_id INT NOT NULL,
  booking_date DATETIME NOT NULL,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  INDEX idx_organizer_id (organizer_id),
  INDEX idx_provider_id (provider_id),
  INDEX idx_status (status),
  INDEX idx_booking_date (booking_date)
)
```

**Fields:**
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | INT | NO | AUTO | Booking identifier |
| organizer_id | INT | NO | - | FK to users (organizer) |
| provider_id | INT | NO | - | FK to users (provider) |
| service_id | INT | NO | - | FK to services |
| booking_date | DATETIME | NO | - | When service needed |
| status | ENUM | YES | 'pending' | Booking status |
| notes | TEXT | YES | NULL | Special requests |
| created_at | TIMESTAMP | YES | CURRENT | Booking time |
| updated_at | TIMESTAMP | YES | CURRENT | Last update time |

**Status Values:** `pending`, `confirmed`, `completed`, `cancelled`

**Relationships:**
- Many-to-one with `users` (as organizer_id and provider_id)
- Many-to-one with `services` (via service_id)
- One-to-many with `reviews` (via booking_id)

---

### 6. `messages`
**Purpose:** Direct messaging between users

```sql
CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  recipient_id INT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sender_recipient (sender_id, recipient_id),
  INDEX idx_is_read (is_read)
)
```

**Fields:**
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | INT | NO | AUTO | Message identifier |
| sender_id | INT | NO | - | FK to users (sender) |
| recipient_id | INT | NO | - | FK to users (recipient) |
| message | TEXT | NO | - | Message content |
| is_read | BOOLEAN | YES | FALSE | Read status |
| created_at | TIMESTAMP | YES | CURRENT | Sent timestamp |

**Relationships:**
- Many-to-one with `users` (as sender_id and recipient_id)

---

### 7. `images`
**Purpose:** Track uploaded images

```sql
CREATE TABLE images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size INT,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_upload_date (upload_date)
)
```

**Fields:**
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | INT | NO | AUTO | Image identifier |
| user_id | INT | NO | - | FK to users |
| file_path | VARCHAR(255) | NO | - | Storage path |
| file_type | VARCHAR(50) | YES | NULL | MIME type |
| file_size | INT | YES | NULL | File size in bytes |
| upload_date | TIMESTAMP | YES | CURRENT | Upload timestamp |

**Relationships:**
- Many-to-one with `users` (via user_id)

---

### 8. `reviews`
**Purpose:** Ratings and reviews for completed bookings

```sql
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  provider_id INT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES service_bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_provider_id (provider_id),
  INDEX idx_rating (rating)
)
```

**Fields:**
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | INT | NO | AUTO | Review identifier |
| booking_id | INT | NO | - | FK to service_bookings |
| reviewer_id | INT | NO | - | FK to users (reviewer) |
| provider_id | INT | NO | - | FK to users (provider) |
| rating | INT | YES | NULL | Rating 1-5 |
| comment | TEXT | YES | NULL | Review text |
| created_at | TIMESTAMP | YES | CURRENT | Review timestamp |

**Rating Range:** 1-5 stars

**Relationships:**
- Many-to-one with `service_bookings` (via booking_id)
- Many-to-one with `users` (as reviewer_id and provider_id)

---

## Entity Relationship Diagram (ERD)

```
┌─────────────┐
│   users     │
├─────────────┤
│ id (PK)     │
│ name        │
│ email       │
│ password    │
│ role        │
│ ...         │
└──────┬──────┘
       │
       ├─────────────────────────┬─────────────┬──────────────┐
       │                         │             │              │
   1:1 │                     1:n │         1:n │          1:n  │
       │                         │             │              │
┌──────▼────────────┐   ┌─────────────┐  ┌─────────────┐  ┌──────────────┐
│service_providers  │   │   events    │  │  messages   │  │   images     │
├──────────────────┤   ├─────────────┤  ├─────────────┤  ├──────────────┤
│ id (PK)          │   │ id (PK)     │  │ id (PK)     │  │ id (PK)      │
│ user_id (FK)     │   │ organizer.. │  │ sender_id..  │  │ user_id (FK) │
│ business_name    │   │ event_name  │  │ recipient..  │  │ file_path    │
│ service_type     │   │ event_date  │  │ message     │  │ file_type    │
│ ...              │   │ ...         │  │ is_read     │  │ ...          │
└──────┬───────────┘   └─────────────┘  └─────────────┘  └──────────────┘
       │
   1:n │
       │
  ┌────▼──────────────┐
  │   services        │
  ├───────────────────┤
  │ id (PK)           │
  │ provider_id (FK)  │
  │ name              │
  │ price             │
  │ ...               │
  └────┬──────────────┘
       │
   1:n │
       │
  ┌────▼────────────────────┐
  │ service_bookings        │
  ├─────────────────────────┤
  │ id (PK)                 │
  │ organizer_id (FK)       │
  │ provider_id (FK)        │
  │ service_id (FK)         │
  │ booking_date            │
  │ status                  │
  │ ...                     │
  └────┬────────────────────┘
       │
   1:n │
       │
  ┌────▼──────────────┐
  │   reviews         │
  ├───────────────────┤
  │ id (PK)           │
  │ booking_id (FK)   │
  │ reviewer_id (FK)  │
  │ provider_id (FK)  │
  │ rating            │
  │ comment           │
  └───────────────────┘
```

---

## Useful Queries

### Get all services by a provider
```sql
SELECT s.* FROM services s
JOIN service_providers sp ON s.provider_id = sp.id
WHERE sp.user_id = ? AND s.is_active = TRUE;
```

### Get booking history for an organizer
```sql
SELECT sb.*, u.name as provider_name, s.name as service_name
FROM service_bookings sb
JOIN users u ON sb.provider_id = u.id
JOIN services s ON sb.service_id = s.id
WHERE sb.organizer_id = ?
ORDER BY sb.created_at DESC;
```

### Get provider ratings
```sql
SELECT AVG(r.rating) as avg_rating, COUNT(r.id) as total_reviews
FROM reviews r
WHERE r.provider_id = ?;
```

### Get unread messages for user
```sql
SELECT m.*, u.name as sender_name
FROM messages m
JOIN users u ON m.sender_id = u.id
WHERE m.recipient_id = ? AND m.is_read = FALSE
ORDER BY m.created_at DESC;
```

---

## Data Types Reference

| Type | Size | Description |
|------|------|-------------|
| INT | 4 bytes | Integer (range: -2,147,483,648 to 2,147,483,647) |
| VARCHAR(n) | n bytes | Variable-length string |
| TEXT | 0-65,535 bytes | Text field for larger content |
| DECIMAL(p,s) | - | Precise decimal (p=total digits, s=decimal places) |
| BOOLEAN | 1 byte | TRUE or FALSE (stored as 0/1) |
| JSON | - | Stores JSON objects/arrays |
| ENUM | - | Set of predefined string values |
| TIMESTAMP | 4 bytes | Date and time (auto-updates) |
| DATETIME | 8 bytes | Date and time (manual) |

---

## Index Strategy

**Indexes for Performance:**
- `idx_email` on users - Fast login lookups
- `idx_role` on users - Filter by user type
- `idx_service_type` on service_providers - Browse by service
- `idx_rating` on service_providers - Sort by rating
- `idx_provider_id` on services - Get provider services
- `idx_organizer_id` on service_bookings - Find user bookings
- `idx_status` on service_bookings - Filter by booking status
- `idx_booking_date` on service_bookings - Range queries
- `idx_sender_recipient` on messages - Conversation lookups
- `idx_provider_id` on reviews - Get provider reviews
- `idx_rating` on reviews - Sort by rating

---

## Maintenance

### View Table Structure
```bash
mysql -u root -D huzz_auth -e "DESC users;"
```

### View All Tables
```bash
mysql -u root -D huzz_auth -e "SHOW TABLES;"
```

### View Table Size
```bash
mysql -u root -D huzz_auth -e "
SELECT TABLE_NAME, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'huzz_auth';
"
```

### Backup Database
```bash
mysqldump -u root -D huzz_auth > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database
```bash
mysql -u root -D huzz_auth < backup_20240127_120000.sql
```
