# Dashboard Widget System Setup Guide

This guide explains how to configure your dashboard to load widgets from the PostgreSQL database.

## Overview

Your dashboard has been configured to store and load all widgets (KPI cards, charts, maps) from the database. The system includes:

- **4 KPI Cards**: OFR, WFR, GFR, and Last Refresh
- **4 Line Charts**: Oil, Water, Gas Flow Rates, and Fractions Chart
- **1 Pie Chart**: Top Regions
- **1 Map Widget**: Production Map

All widgets are now defined in the database and loaded dynamically on the frontend.

## Database Setup

### 1. Start PostgreSQL Database

Ensure your PostgreSQL database is running:

```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# If not running, start it (Ubuntu/Debian)
sudo systemctl start postgresql

# Or (macOS with Homebrew)
brew services start postgresql
```

### 2. Create Database (if not exists)

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE "saher-dashboard";

# Exit
\q
```

### 3. Run Migrations

The necessary tables should already exist:
- `widget_types`
- `widget_definitions`
- `dashboards`
- `dashboard_layouts`

If tables don't exist, they will be created automatically by your existing migration system.

### 4. Seed Widget Types

Run this to create all widget type definitions:

```bash
cd backend
DATABASE_URL="postgresql://postgres:saad@localhost:5432/saher-dashboard" node scripts/seedWidgets.js
```

Expected output:
```
Seeding widget types...
✓ Created widget type: gauge
✓ Created widget type: line_chart
✓ Created widget type: kpi
✓ Created widget type: pie_chart
✓ Created widget type: map
...
Widget types seeded successfully!
```

### 5. Seed Default Dashboard Configuration

This creates the default dashboard with all current widgets:

```bash
cd backend
DATABASE_URL="postgresql://postgres:saad@localhost:5432/saher-dashboard" node scripts/seedDefaultDashboard.js
```

Expected output:
```
Seeding default dashboard configuration...
✓ Created default dashboard, ID: 1
✓ Created widget: OFR KPI Card
✓ Created widget: WFR KPI Card
✓ Created widget: GFR KPI Card
✓ Created widget: Last Refresh Card
✓ Created widget: OFR Line Chart
✓ Created widget: WFR Line Chart
✓ Created widget: GFR Line Chart
✓ Created widget: Fractions Chart
✓ Created widget: Top Regions Pie Chart
✓ Created widget: Production Map

✓ Default dashboard seeded successfully!
  - Dashboard ID: 1
  - Widgets created: 10
  - Owner: User 1
```

## Frontend Integration

The frontend has been updated to:

1. **Load Dashboard Configuration**: On mount, the `DashboardContent` component fetches:
   - Available dashboards for the user
   - Widget layouts for the selected dashboard

2. **Widget Metadata Storage**: Each widget stores:
   - Layout position (x, y, width, height)
   - Data source configuration (metrics, time ranges, etc.)
   - Display order
   - Widget type information

3. **Maintain Current UI**: The dashboard still renders with the exact same appearance and functionality, but now it's driven by database configuration.

## API Endpoints

The following endpoints are now being used:

```typescript
// Get user's dashboards
GET /api/dashboards
Authorization: Bearer <token>

// Get dashboard layouts (widgets)
GET /api/dashboard-layouts/dashboard/:dashboardId
Authorization: Bearer <token>
```

## Widget Configuration Examples

### KPI Widget
```json
{
  "name": "OFR KPI Card",
  "widget_type": "kpi",
  "data_source_config": {
    "metric": "ofr",
    "unit": "l/min"
  },
  "layout_config": {
    "x": 0,
    "y": 0,
    "w": 3,
    "h": 2
  },
  "display_order": 1
}
```

### Line Chart Widget
```json
{
  "name": "OFR Line Chart",
  "widget_type": "line_chart",
  "data_source_config": {
    "metric": "ofr",
    "timeRange": "dynamic",
    "yAxisLabel": "OFR (l/min)",
    "showOil": true
  },
  "layout_config": {
    "x": 0,
    "y": 2,
    "w": 6,
    "h": 4
  },
  "display_order": 5
}
```

### Map Widget
```json
{
  "name": "Production Map",
  "widget_type": "map",
  "data_source_config": {
    "showDevices": true,
    "showHierarchy": true,
    "clusterMarkers": true
  },
  "layout_config": {
    "x": 0,
    "y": 15,
    "w": 12,
    "h": 6
  },
  "display_order": 10
}
```

## Verification

After setup, verify everything works:

1. **Check Database**:
   ```bash
   psql -U postgres -d saher-dashboard -c "SELECT COUNT(*) FROM widget_types;"
   psql -U postgres -d saher-dashboard -c "SELECT COUNT(*) FROM dashboards;"
   psql -U postgres -d saher-dashboard -c "SELECT COUNT(*) FROM dashboard_layouts;"
   ```

2. **Start Backend**:
   ```bash
   cd backend
   npm start
   ```

3. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

4. **Open Browser**:
   - Navigate to the dashboard
   - All widgets should load in their correct positions
   - Check browser console for any errors

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` in `backend/.env`
- Check PostgreSQL is running: `pg_isready`
- Test connection: `psql -U postgres -d saher-dashboard -c "SELECT 1;"`

### Widgets Not Loading
- Check browser console for API errors
- Verify backend is running on correct port
- Check authentication token is valid
- Verify dashboard and layouts exist in database

### Missing Widgets
- Re-run seed scripts
- Check widget_types table has all entries
- Verify user has access to dashboard

## Next Steps

Now that widgets are stored in the database:

1. **Add New Widgets**: Create widget definitions and add to dashboard layouts
2. **Customize Layouts**: Modify `layout_config` for different arrangements
3. **User Preferences**: Allow users to create custom dashboards
4. **Drag-and-Drop**: Implement drag-and-drop functionality to rearrange widgets

## File Changes Summary

### Backend
- `scripts/seedDefaultDashboard.js` - Seeds default dashboard configuration
- `routes/dashboardLayouts.js` - Already exists, handles widget layouts
- `models/Dashboard.js` - Already exists
- `models/DashboardLayout.js` - Already exists
- `models/WidgetDefinition.js` - Already exists
- `models/WidgetType.js` - Already exists

### Frontend
- `services/api.ts` - Added dashboard and layout API methods
- `components/Dashboard/DashboardContent.tsx` - Loads widgets from database
- `components/Dashboard/WidgetRenderer.tsx` - New component for rendering widgets

## Database Schema

### widget_types
Stores widget type definitions (KPI, line_chart, pie_chart, map, etc.)

### widget_definitions
Stores specific widget instances with data source configurations

### dashboards
Stores dashboard metadata and grid configuration

### dashboard_layouts
Links widgets to dashboards with layout positions and display order

---

Your dashboard is now database-driven while maintaining the exact same functionality and appearance!
