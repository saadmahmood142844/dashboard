# Widget Type System - Complete Code Review Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [Model Layer (WidgetType.js)](#model-layer)
4. [Route Layer (widgetTypes.js)](#route-layer)
5. [Seeding Script (seedWidgets.js)](#seeding-script)
6. [Common Interview Questions & Answers](#common-interview-questions)

---

## System Overview

### What is the Widget Type System?
The widget type system is a **template/blueprint system** for creating reusable dashboard components. Think of it as a factory pattern for widgets.

**Real-world analogy**: Widget types are like "car models" (Honda Civic, Toyota Camry), while widget definitions are specific instances (my red Honda Civic with leather seats).

### Architecture Flow
```
Database (widget_types table)
    ↕
Model (WidgetType.js) - Data access & business logic
    ↕
Routes (widgetTypes.js) - HTTP endpoints & validation
    ↕
Client (Frontend) - Makes API calls
```

### Why This System Exists
1. **Reusability**: Define a widget type once (e.g., "line_chart"), use it many times
2. **Consistency**: All line charts follow the same structure
3. **Configuration**: Each widget type has sensible defaults
4. **Separation of Concerns**: Widget types (templates) vs widget definitions (instances)

---

## Database Schema

### Table: `widget_types`

```sql
CREATE TABLE IF NOT EXISTS widget_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  component_name VARCHAR(100) NOT NULL,
  default_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)
```

### Field Breakdown

#### `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
**Q: Why UUID instead of auto-increment integers (1, 2, 3)?**

**Answer:**
- **Distributed Systems**: UUIDs work across multiple databases without collision risk
- **Security**: Sequential IDs leak information (how many records exist, rate of creation)
- **Merge-Safe**: If you have staging/production databases, no ID conflicts when merging
- **API Exposure**: UUIDs don't expose business metrics
- **Future-Proof**: Easier to scale horizontally (multiple database servers)

**Example Scenario:**
```
Bad (Sequential):
- Production creates widget type id=5
- Staging creates widget type id=5
- Merge = CONFLICT!

Good (UUID):
- Production creates id=550e8400-e29b-41d4-a716-446655440000
- Staging creates id=7c9e6679-7425-40de-944b-e07fc1f90ae7
- Merge = No conflict!
```

#### `name VARCHAR(100) NOT NULL UNIQUE`
- **Purpose**: Human-readable identifier (e.g., "line_chart", "gauge")
- **UNIQUE**: Prevents duplicate widget types
- **NOT NULL**: Every widget type must have a name
- **Use Case**: Frontend can reference by name instead of UUID

#### `component_name VARCHAR(100) NOT NULL`
- **Purpose**: Maps to the React component name (e.g., "LineChartWidget")
- **Frontend Connection**: Frontend uses this to dynamically load the correct component
- **Example**: When rendering, React does: `const Component = ComponentRegistry[component_name]`

#### `default_config JSONB NOT NULL DEFAULT '{}'`
- **JSONB**: Binary JSON format (faster queries than TEXT)
- **Purpose**: Stores default configuration for this widget type
- **Flexible Schema**: Each widget type can have different config structure
- **Example**:
```json
{
  "timeRange": "24h",
  "showGrid": true,
  "colors": ["#3b82f6", "#8b5cf6"]
}
```

#### `created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`
- **TIMESTAMPTZ**: Timestamp with timezone (handles international users)
- **Audit Trail**: When was this widget type created
- **Use Case**: Debugging, analytics, compliance

---

## Model Layer

**File**: `/backend/models/WidgetType.js`

### Class Structure

#### Constructor (Lines 4-10)
```javascript
constructor(data = {}) {
  this.id = data.id;
  this.name = data.name;
  this.component_name = data.component_name;
  this.default_config = data.default_config || {};
  this.created_at = data.created_at;
}
```

**Purpose**:
- Creates a WidgetType object from database row data
- Provides a consistent object shape
- Sets default empty object for `default_config` if missing

**Q: Why use a class instead of plain objects?**
**A**:
- Type consistency across the application
- Can add instance methods if needed
- Easier to extend functionality later
- Better IDE autocomplete support

---

### Method: `create()` (Lines 12-28)

```javascript
static async create(widgetTypeData) {
  const { name, component_name, default_config = {} } = widgetTypeData;

  const query = `
    INSERT INTO widget_types (name, component_name, default_config)
    VALUES ($1, $2, $3)
    RETURNING *
  `;

  const result = await database.query(query, [
    name,
    component_name,
    JSON.stringify(default_config)
  ]);

  return result.rows[0] ? new WidgetType(result.rows[0]) : null;
}
```

**Purpose**: Creates a new widget type in the database

**Key Concepts:**

1. **Static Method**: Called on class, not instance (`WidgetType.create()` not `widgetType.create()`)

2. **Destructuring**: `const { name, component_name, default_config = {} } = widgetTypeData`
   - Extracts specific fields
   - Sets default empty object for config

3. **Parameterized Query**: `VALUES ($1, $2, $3)`
   - **Q: Why not string concatenation?**
   - **A: SQL Injection Prevention!**

   ```javascript
   // BAD - SQL Injection vulnerable
   query = `INSERT INTO widget_types VALUES ('${name}', '${component}')`
   // Attacker sends: name = "'; DROP TABLE widget_types; --"

   // GOOD - Safe
   query = `INSERT INTO widget_types VALUES ($1, $2)`
   params = [name, component]
   ```

4. **JSON.stringify()**: Converts JavaScript object to JSON string for JSONB storage

5. **RETURNING ***: PostgreSQL feature returns the inserted row (including auto-generated ID)

6. **Null Safety**: Returns `null` if no row created (shouldn't happen but defensive)

---

### Method: `findById()` (Lines 30-34)

```javascript
static async findById(id) {
  const query = 'SELECT * FROM widget_types WHERE id = $1';
  const result = await database.query(query, [id]);
  return result.rows[0] ? new WidgetType(result.rows[0]) : null;
}
```

**Purpose**: Retrieve a single widget type by UUID

**Return Value**:
- WidgetType object if found
- `null` if not found

**Q: Why return null instead of throwing error?**
**A**:
- Caller can decide how to handle (404 response, default value, etc.)
- Not finding a record is often a valid state, not an error
- More flexible error handling

---

### Method: `findByName()` (Lines 36-40)

```javascript
static async findByName(name) {
  const query = 'SELECT * FROM widget_types WHERE name = $1';
  const result = await database.query(query, [name]);
  return result.rows[0] ? new WidgetType(result.rows[0]) : null;
}
```

**Purpose**: Retrieve widget type by name (e.g., "line_chart")

**Use Case**:
- Check if widget type already exists before creating
- Frontend can lookup by friendly name

---

### Method: `findAll()` (Lines 42-46)

```javascript
static async findAll() {
  const query = 'SELECT * FROM widget_types ORDER BY name ASC';
  const result = await database.query(query);
  return result.rows.map(row => new WidgetType(row));
}
```

**Purpose**: Get all widget types (sorted alphabetically)

**Key Concepts**:
- `ORDER BY name ASC`: Consistent, predictable ordering
- `.map()`: Transforms each database row into WidgetType object
- Returns array (could be empty)

---

### Method: `update()` (Lines 48-82)

```javascript
static async update(id, updateData) {
  const allowedFields = ['name', 'component_name', 'default_config'];
  const updates = [];
  const values = [];
  let paramIndex = 2;

  Object.keys(updateData).forEach(key => {
    if (allowedFields.includes(key)) {
      if (key === 'default_config') {
        updates.push(`${key} = $${paramIndex}`);
        values.push(JSON.stringify(updateData[key]));
      } else {
        updates.push(`${key} = $${paramIndex}`);
        values.push(updateData[key]);
      }
      paramIndex++;
    }
  });

  if (updates.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.unshift(id);

  const query = `
    UPDATE widget_types
    SET ${updates.join(', ')}
    WHERE id = $1
    RETURNING *
  `;

  const result = await database.query(query, values);
  return result.rows[0] ? new WidgetType(result.rows[0]) : null;
}
```

**Purpose**: Update existing widget type

**This is the most complex method - let's break it down:**

#### 1. Field Whitelisting (Line 49)
```javascript
const allowedFields = ['name', 'component_name', 'default_config'];
```
**Q: Why whitelist instead of allowing all fields?**
**A**:
- **Security**: Prevents updating `id` or `created_at`
- **Mass Assignment Protection**: User can't inject malicious fields
- **Explicit Control**: We know exactly what can be updated

#### 2. Dynamic Query Building (Lines 50-66)
```javascript
const updates = [];  // Will hold: ["name = $2", "component_name = $3"]
const values = [];   // Will hold: [id, "new_name", "NewComponent"]
let paramIndex = 2;  // Start at 2 because $1 is reserved for id
```

**Why Dynamic?**
- User might only update `name`, or only `default_config`, or both
- We build the SQL query based on what fields are provided

**Example Flow:**
```javascript
// Input: updateData = { name: "new_gauge", component_name: "NewGauge" }

// After loop:
updates = ["name = $2", "component_name = $3"]
values = ["new_gauge", "NewGauge"]
paramIndex = 4

// Add id to beginning:
values.unshift(id)
// values = [id, "new_gauge", "NewGauge"]

// Final SQL:
UPDATE widget_types
SET name = $2, component_name = $3
WHERE id = $1
RETURNING *
```

#### 3. Special Handling for JSONB (Lines 56-58)
```javascript
if (key === 'default_config') {
  values.push(JSON.stringify(updateData[key]));
}
```
**Why?** JSONB columns need JSON string, not JavaScript object

#### 4. Validation (Lines 68-70)
```javascript
if (updates.length === 0) {
  throw new Error('No valid fields to update');
}
```
**Prevents empty UPDATE queries** (SQL error)

#### 5. Parameter Index Pattern
**Q: Why start paramIndex at 2?**
**A**:
- `$1` is reserved for `id` in WHERE clause
- `$2, $3, $4...` are for the SET fields
- `values.unshift(id)` puts id at position 0 (which maps to $1)

---

### Method: `delete()` (Lines 84-88)

```javascript
static async delete(id) {
  const query = 'DELETE FROM widget_types WHERE id = $1 RETURNING *';
  const result = await database.query(query, [id]);
  return result.rows[0] ? new WidgetType(result.rows[0]) : null;
}
```

**Purpose**: Delete widget type

**Note**: `RETURNING *` gives us the deleted row (useful for logging/audit)

**Q: What happens to widget_definitions that reference this widget_type?**
**A**: Database has `ON DELETE RESTRICT` - deletion will fail if there are references. This is **intentional** to prevent orphaned data.

---

## Route Layer

**File**: `/backend/routes/widgetTypes.js`

### Route: `GET /` (Lines 6-23)

```javascript
router.get('/', protect, async (req, res) => {
  try {
    const widgetTypes = await WidgetType.findAll();

    res.json({
      success: true,
      data: widgetTypes,
      count: widgetTypes.length
    });
  } catch (error) {
    console.error('Error fetching widget types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch widget types',
      error: error.message
    });
  }
});
```

**Purpose**: Get all widget types

**Middleware**: `protect` - requires authentication

**Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid...",
      "name": "line_chart",
      "component_name": "LineChartWidget",
      "default_config": {...}
    }
  ],
  "count": 11
}
```

**Error Handling**:
- `try/catch` prevents server crash
- Returns 500 status on error
- Consistent error response format

---

### Route: `GET /:id` (Lines 25-49)

```javascript
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const widgetType = await WidgetType.findById(id);

    if (!widgetType) {
      return res.status(404).json({
        success: false,
        message: 'Widget type not found'
      });
    }

    res.json({
      success: true,
      data: widgetType
    });
  } catch (error) {
    // ... error handling
  }
});
```

**Purpose**: Get single widget type by ID

**URL**: `GET /api/widget-types/550e8400-e29b-41d4-a716-446655440000`

**Status Codes**:
- `200`: Success
- `404`: Widget type not found
- `500`: Server error

**Q: Why check `if (!widgetType)` before returning?**
**A**:
- UUIDs are valid even if record doesn't exist
- Better UX: explicit "not found" message
- Proper HTTP status code

---

### Route: `POST /` (Lines 51-96)

```javascript
router.post('/', protect, async (req, res) => {
  try {
    // Authorization check
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can create widget types'
      });
    }

    // Input validation
    const { name, component_name, default_config } = req.body;
    if (!name || !component_name) {
      return res.status(400).json({
        success: false,
        message: 'Name and component_name are required'
      });
    }

    // Duplicate check
    const existingWidget = await WidgetType.findByName(name);
    if (existingWidget) {
      return res.status(409).json({
        success: false,
        message: 'Widget type with this name already exists'
      });
    }

    // Create
    const widgetType = await WidgetType.create({
      name,
      component_name,
      default_config: default_config || {}
    });

    res.status(201).json({
      success: true,
      message: 'Widget type created successfully',
      data: widgetType
    });
  } catch (error) {
    // ... error handling
  }
});
```

**Purpose**: Create new widget type

**Security Layers**:

1. **Authentication** (`protect` middleware): Must be logged in
2. **Authorization** (line 53): Must be admin
3. **Input Validation** (line 62): Required fields present
4. **Business Logic Validation** (line 69): No duplicate names

**Status Codes**:
- `201`: Created successfully
- `400`: Bad request (missing fields)
- `403`: Forbidden (not admin)
- `409`: Conflict (duplicate name)
- `500`: Server error

**Q: Why 201 instead of 200?**
**A**:
- HTTP standard for "resource created"
- More semantically correct
- Helps with API documentation/testing

---

### Route: `PUT /:id` (Lines 98-133)

```javascript
router.put('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update widget types'
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    const widgetType = await WidgetType.findById(id);
    if (!widgetType) {
      return res.status(404).json({
        success: false,
        message: 'Widget type not found'
      });
    }

    const updatedWidgetType = await WidgetType.update(id, updateData);

    res.json({
      success: true,
      message: 'Widget type updated successfully',
      data: updatedWidgetType
    });
  } catch (error) {
    // ... error handling
  }
});
```

**Purpose**: Update existing widget type

**Two-step process**:
1. Check if exists (line 113)
2. Update if found (line 121)

**Q: Why check existence before updating?**
**A**:
- Better error message (404 vs generic error)
- Avoid unnecessary database update attempt
- Consistent API behavior

---

### Route: `DELETE /:id` (Lines 135-168)

```javascript
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete widget types'
      });
    }

    const { id } = req.params;

    const widgetType = await WidgetType.findById(id);
    if (!widgetType) {
      return res.status(404).json({
        success: false,
        message: 'Widget type not found'
      });
    }

    await WidgetType.delete(id);

    res.json({
      success: true,
      message: 'Widget type deleted successfully'
    });
  } catch (error) {
    // ... error handling
  }
});
```

**Purpose**: Delete widget type

**Protection**:
- Admin only
- Existence check before deletion
- Database constraint prevents deletion if referenced

---

## Seeding Script

**File**: `/backend/scripts/seedWidgets.js`

### Purpose
Pre-populate database with standard widget types during initial setup

### Widget Types Seeded (11 total)

1. **gauge** - Circular gauge display
2. **line_chart** - Time-series line chart
3. **bar_chart** - Vertical/horizontal bars
4. **kpi** - Key Performance Indicator card
5. **table** - Data table with pagination
6. **pie_chart** - Circular pie chart
7. **map** - Geographic map with markers
8. **area_chart** - Filled area chart
9. **donut_chart** - Donut/ring chart
10. **stacked_bar** - Stacked bar chart
11. **alarms_table** - Alarm management table

### Key Logic (Lines 148-169)

```javascript
for (const widgetType of widgetTypes) {
  // Check if already exists
  const checkQuery = 'SELECT id FROM widget_types WHERE name = $1';
  const existingResult = await database.query(checkQuery, [widgetType.name]);

  if (existingResult.rows.length === 0) {
    // Create new
    const insertQuery = `
      INSERT INTO widget_types (name, component_name, default_config)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    await database.query(insertQuery, [
      widgetType.name,
      widgetType.component_name,
      JSON.stringify(widgetType.default_config)
    ]);

    console.log(`✓ Created widget type: ${widgetType.name}`);
  } else {
    console.log(`○ Widget type already exists: ${widgetType.name}`);
  }
}
```

**Idempotent Design**:
- Can run multiple times without duplicates
- Checks existence before inserting
- Safe for production environments

**Q: Why not use `INSERT ... ON CONFLICT DO NOTHING`?**
**A**:
- More explicit logging (shows what was created vs skipped)
- Could extend to update existing records if needed
- Easier to debug

### Example Widget Type Config

```javascript
{
  name: 'line_chart',
  component_name: 'LineChartWidget',
  default_config: {
    timeRange: '24h',
    yAxisLabel: '',
    xAxisLabel: 'Time',
    showGrid: true,
    showLegend: true,
    curveType: 'smooth',
    colors: ['#3b82f6', '#8b5cf6', '#ec4899'],
    showOil: true,
    showGas: true,
    showWater: true
  }
}
```

**Config Purpose**:
- Frontend uses these defaults when creating new chart
- User can override in widget definition
- Ensures consistent initial state

---

## Common Interview Questions & Answers

### General Architecture

**Q: Explain the difference between widget types and widget definitions.**

**A**:
- **Widget Type**: Template/blueprint (e.g., "line_chart" concept)
- **Widget Definition**: Configured instance (e.g., "Oil Production Trend Chart" that uses line_chart type)
- Analogy: Class vs Instance, Recipe vs Dish, Blueprint vs Building

---

**Q: Why separate widget types into their own table instead of hardcoding in the application?**

**A**:
1. **Database-driven**: Can add new widget types without code deployment
2. **Data integrity**: Foreign key constraints ensure valid references
3. **Centralized**: Single source of truth
4. **Queryable**: Can join to get widget type info with definitions
5. **Auditable**: Track when widget types were added

---

**Q: Walk me through what happens when a user creates a new widget on their dashboard.**

**A**:
1. User selects widget type (e.g., "line_chart") from dropdown
2. Frontend fetches widget type details (GET /api/widget-types/:id)
3. Shows configuration form pre-filled with default_config
4. User customizes (changes colors, time range, etc.)
5. Frontend creates widget_definition (POST /api/widget-definitions)
6. Widget definition references widget_type_id
7. Dashboard adds the widget_definition_id to its layout

---

### Database Design

**Q: Why use UUID instead of serial integers for IDs?**

**A**: See detailed explanation in Database Schema section above. Key points:
- Security (no sequence leakage)
- Distributed systems (no ID collisions)
- Merge-safe (staging/production)
- API exposure (don't reveal business metrics)

---

**Q: What is JSONB and why use it for config?**

**A**:
- **JSON**: Text-based format for structured data
- **JSONB**: Binary format (faster, indexable)
- **Why**: Each widget type has different config needs (gauge vs chart vs table)
- **Flexibility**: Don't need schema migrations for config changes
- **Queryable**: Can query inside JSONB with PostgreSQL operators

---

**Q: What prevents widget types from being deleted if they're in use?**

**A**:
```sql
widget_type_id UUID NOT NULL REFERENCES widget_types(id) ON DELETE RESTRICT
```
- Foreign key constraint with `ON DELETE RESTRICT`
- Database will reject deletion if any widget_definition references it
- Must delete all widget definitions first

---

### Code Implementation

**Q: Why use parameterized queries ($1, $2) instead of string interpolation?**

**A**: **SQL Injection Prevention**

```javascript
// VULNERABLE
const query = `SELECT * FROM widget_types WHERE name = '${userInput}'`
// User sends: userInput = "'; DROP TABLE widget_types; --"
// Executes: SELECT * FROM widget_types WHERE name = ''; DROP TABLE widget_types; --'

// SAFE
const query = `SELECT * FROM widget_types WHERE name = $1`
database.query(query, [userInput])
// User input is treated as DATA, not CODE
```

---

**Q: Explain the update() method's dynamic query building.**

**A**: See detailed breakdown in Model Layer > update() section above.

Key concept: Build SQL dynamically based on which fields user wants to update
- Prevents empty updates
- Maintains parameter safety
- Flexible (update one field or all fields)

---

**Q: Why return the class instance instead of raw database data?**

**A**:
```javascript
// Without class
const raw = result.rows[0]  // { id: '...', name: '...', default_config: '{"x": 1}' }

// With class
const widget = new WidgetType(result.rows[0])  // Consistent object shape
```

Benefits:
- Type consistency
- Default values (e.g., `default_config || {}`)
- Can add methods later
- Better IntelliSense/autocomplete

---

### API Design

**Q: Why different HTTP status codes (200, 201, 400, 403, 404, 409, 500)?**

**A**:
- **200 OK**: Successful GET/PUT/DELETE
- **201 Created**: Successful POST (resource created)
- **400 Bad Request**: Invalid input (missing required fields)
- **403 Forbidden**: Authenticated but not authorized (not admin)
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Duplicate (name already exists)
- **500 Internal Server Error**: Unexpected server error

**Proper status codes enable:**
- Better client-side error handling
- API documentation clarity
- Debugging (immediately know error category)

---

**Q: Why check admin role in routes instead of a separate admin middleware?**

**A**: Could go either way, but inline check provides:
- Flexibility (some routes might allow viewer+admin)
- Explicit (clear who can access)
- Specific error messages

Alternative approach:
```javascript
const { protect, admin } = require('../middleware/auth')
router.post('/', protect, admin, async (req, res) => {...})
```

---

**Q: Why use try-catch in every route?**

**A**:
- Prevents server crash on error
- Centralized error handling
- Consistent error responses
- Logging capability
- User-friendly error messages

Without try-catch: Unhandled promise rejection crashes server

---

### Seeding

**Q: Why check if widget type exists before inserting in seed script?**

**A**: **Idempotency** - Script can run multiple times safely
- First run: Creates all widget types
- Second run: Skips existing, doesn't error
- Deployment-friendly (safe to include in startup scripts)

---

**Q: Why 11 specific widget types? How were they chosen?**

**A**: Based on common dashboard visualization needs:
- **Charts**: line, bar, area, pie, donut, stacked (data visualization)
- **Gauges**: Real-time metrics
- **KPI Cards**: Single value display
- **Tables**: Raw data display, alarms
- **Map**: Geographic data

Can expand later (histogram, heatmap, etc.)

---

**Q: What happens if seeding fails halfway through?**

**A**:
- Each insert is a separate transaction
- Already-inserted types remain
- Failed type can be retried
- Idempotent design means re-running is safe
- Could wrap in transaction for all-or-nothing (but not necessary here)

---

### Security

**Q: How do you prevent unauthorized widget type creation?**

**A**: Multiple layers:
1. **Authentication**: `protect` middleware (must be logged in)
2. **Authorization**: Admin role check
3. **Input validation**: Required fields
4. **Business logic**: Duplicate name check

---

**Q: What prevents SQL injection?**

**A**:
- Parameterized queries (`$1, $2, $3`)
- Never concatenate user input into SQL
- Database driver handles escaping

---

**Q: Why is `default_config` validated as JSON?**

**A**:
- JSONB column type requires valid JSON
- `JSON.stringify()` ensures valid format
- Invalid JSON would cause database error
- Better to validate early

---

### Performance

**Q: Would you add indexes to this table?**

**A**:
```sql
-- Already have:
CREATE UNIQUE INDEX ON widget_types(name)  -- From UNIQUE constraint

-- Might add:
CREATE INDEX ON widget_types(component_name)  -- If querying by component often
CREATE INDEX ON widget_types(created_at)      -- If sorting by date often
```

Current table is small (~11 rows), so indexes not critical yet.

---

**Q: How would you cache widget types?**

**A**:
- Widget types rarely change
- Perfect candidate for caching
- Options:
  1. Redis cache with TTL
  2. In-memory cache (Node.js Map)
  3. HTTP cache headers (ETag, Cache-Control)

Example:
```javascript
const cache = new Map()

static async findAll() {
  if (cache.has('all')) {
    return cache.get('all')
  }

  const result = await database.query('SELECT * FROM widget_types')
  const widgets = result.rows.map(row => new WidgetType(row))

  cache.set('all', widgets)
  setTimeout(() => cache.delete('all'), 3600000)  // 1 hour TTL

  return widgets
}
```

---

### Testing

**Q: How would you test this code?**

**A**:

**Unit Tests**:
```javascript
describe('WidgetType.create()', () => {
  it('should create widget type with valid data')
  it('should throw error if name is missing')
  it('should handle JSONB serialization')
})
```

**Integration Tests**:
```javascript
describe('POST /api/widget-types', () => {
  it('should return 201 with valid data')
  it('should return 403 for non-admin')
  it('should return 409 for duplicate name')
  it('should return 400 for missing fields')
})
```

**Database Tests**:
- Constraint tests (UNIQUE, NOT NULL)
- Foreign key tests
- Transaction rollback tests

---

### Scalability

**Q: How would this scale with 10,000 widget types?**

**A**:
- Current design scales well (indexed lookups)
- Pagination needed for `findAll()`
- Caching becomes more important
- Consider full-text search for names

```javascript
static async findAll(page = 1, limit = 50) {
  const offset = (page - 1) * limit
  const query = `
    SELECT * FROM widget_types
    ORDER BY name ASC
    LIMIT $1 OFFSET $2
  `
  const result = await database.query(query, [limit, offset])
  return result.rows.map(row => new WidgetType(row))
}
```

---

**Q: What if multiple servers are creating widget types simultaneously?**

**A**:
- UNIQUE constraint on name prevents duplicates
- Database handles concurrency
- One will succeed, others get constraint violation
- Application handles 409 Conflict response

---

### Debugging

**Q: How would you debug "Widget type not found" errors?**

**A**:
1. Check UUID validity (malformed?)
2. Verify widget type exists (`SELECT * FROM widget_types WHERE id = '...'`)
3. Check if deleted recently (audit logs)
4. Verify foreign key references intact
5. Check application logs for error details

---

**Q: What logs would you add for production monitoring?**

**A**:
```javascript
// Add structured logging
const logger = require('./logger')

static async create(widgetTypeData) {
  logger.info('Creating widget type', { name: widgetTypeData.name })

  const result = await database.query(...)

  logger.info('Widget type created', {
    id: result.rows[0].id,
    name: result.rows[0].name
  })

  return new WidgetType(result.rows[0])
}
```

Track:
- Creation/update/deletion events
- Admin actions
- Error rates
- Query performance

---

## Summary

### Key Takeaways

1. **Widget Type System**: Template-based approach for reusable dashboard components
2. **UUID vs Sequential**: Security, scalability, merge-safety
3. **JSONB**: Flexible configuration storage
4. **Parameterized Queries**: SQL injection prevention
5. **Status Codes**: Proper HTTP semantics
6. **Authorization**: Admin-only for create/update/delete
7. **Idempotency**: Seeding script safe to run multiple times
8. **Separation of Concerns**: Model (data) → Routes (API) → Frontend

### Architecture Benefits

- **Maintainable**: Clear separation of concerns
- **Secure**: Multiple security layers
- **Scalable**: UUID, indexes, caching ready
- **Flexible**: JSONB allows varied configurations
- **Testable**: Pure functions, mockable database
- **Debuggable**: Consistent error handling and logging

---

## Quick Reference

### API Endpoints
- `GET /api/widget-types` - List all (auth required)
- `GET /api/widget-types/:id` - Get one (auth required)
- `POST /api/widget-types` - Create (admin only)
- `PUT /api/widget-types/:id` - Update (admin only)
- `DELETE /api/widget-types/:id` - Delete (admin only)

### Files
- Model: `/backend/models/WidgetType.js`
- Routes: `/backend/routes/widgetTypes.js`
- Seeding: `/backend/scripts/seedWidgets.js`
- Schema: `/backend/config/database.js` (lines 214-221)

### Database
- Table: `widget_types`
- Primary Key: UUID
- Unique Constraint: `name`
- Referenced by: `widget_definitions.widget_type_id`

---

**Pro Tip for Code Review**:
Walk through a complete flow (e.g., "User creates a line chart widget") touching each layer:
1. Database schema
2. Seeding (initial data)
3. Model methods
4. API routes
5. Frontend integration

This demonstrates understanding of the entire stack!
