# Widget System Setup Guide

## Overview

This widget system provides a complete backend solution for building dynamic, customizable dashboards with drag-and-drop functionality. Users can create custom widget definitions, build personalized dashboards, and share them with team members.

## Architecture

### Database Tables

1. **widget_types** - Catalog of available widget types (gauge, chart, table, etc.)
2. **widget_definitions** - User-created widget instances with custom configurations
3. **dashboards** - Dashboard containers with grid layout settings
4. **dashboard_layouts** - Widget positions and configurations within dashboards
5. **dashboard_shares** - Dashboard sharing and permissions

### API Endpoints

- `/api/widget-types` - Manage widget type catalog
- `/api/widget-definitions` - Create and manage widget definitions
- `/api/dashboards` - Create and manage dashboards
- `/api/dashboard-layouts` - Manage widget positions and layouts

## Setup Instructions

### 1. Run Database Migration

Execute the migration file to create all required tables:

```bash
psql -U your_username -d your_database -f backend/migrations/001_create_widget_system.sql
```

Or use your preferred PostgreSQL client to run the SQL file.

### 2. Seed Widget Types

Run the seed script to populate the widget types catalog:

```bash
node backend/scripts/seedWidgets.js
```

This will create the following widget types:
- gauge
- line_chart
- bar_chart
- kpi
- table
- pie_chart
- map
- area_chart
- donut_chart
- stacked_bar
- alarms_table
- flow_rate_chart

### 3. Server Configuration

The routes are already registered in `server.js`. No additional configuration needed.

### 4. Test the APIs

Import the Postman collection:
- File: `backend/postman/10_Widget_System.postman_collection.json`
- Set your auth token in the collection variables
- Test each endpoint to verify functionality

## Usage Flow

### Creating a Dashboard

1. **List available widget types**
   ```
   GET /api/widget-types
   ```

2. **Create widget definitions** (customize data sources and configs)
   ```
   POST /api/widget-definitions
   {
     "name": "Oil Production Chart",
     "widget_type_id": "uuid",
     "data_source_config": {
       "endpoint": "/api/charts/oil-production",
       "refreshInterval": 30000
     }
   }
   ```

3. **Create a dashboard**
   ```
   POST /api/dashboards
   {
     "name": "Production Overview",
     "widgets": [
       {
         "widget_definition_id": "uuid",
         "layout_config": { "x": 0, "y": 0, "w": 6, "h": 3 }
       }
     ]
   }
   ```

4. **Update layouts** (for drag & drop)
   ```
   PUT /api/dashboard-layouts/dashboard/{id}/bulk
   {
     "layouts": [
       { "id": "uuid", "layout_config": { "x": 6, "y": 0, "w": 6, "h": 3 } }
     ]
   }
   ```

### Sharing Dashboards

1. **Share with a user**
   ```
   POST /api/dashboards/{id}/share
   {
     "user_id": 2,
     "permission_level": "view"
   }
   ```

   Permission levels:
   - `view` - Can only view the dashboard
   - `edit` - Can modify widget positions and settings
   - `admin` - Full control including sharing

## Frontend Integration

### Data Source Configuration

Each widget definition includes a `data_source_config` that tells the frontend:
- API endpoint to call
- Refresh interval
- Query parameters
- Data transformation rules

Example:
```json
{
  "endpoint": "/api/charts/production-data",
  "refreshInterval": 30000,
  "params": {
    "timeRange": "24h",
    "deviceId": "dynamic"
  },
  "dataMapping": {
    "x": "timestamp",
    "y": "value"
  }
}
```

### Layout Configuration

Follows React Grid Layout structure:
```json
{
  "x": 0,        // Grid column position
  "y": 0,        // Grid row position
  "w": 6,        // Width in grid units
  "h": 3,        // Height in grid units
  "minW": 4,     // Minimum width
  "minH": 2,     // Minimum height
  "static": false // Can be moved/resized
}
```

### Instance Configuration

Override default widget settings per dashboard instance:
```json
{
  "title": "Custom Title",
  "color": "#3b82f6",
  "showLegend": false
}
```

## Security Features

1. **Authentication** - All endpoints require valid JWT token
2. **Ownership** - Users can only modify their own widgets and dashboards
3. **Permissions** - Shared dashboards enforce view/edit/admin permissions
4. **Validation** - Foreign key constraints prevent orphaned records

## Performance Considerations

1. **Indexes** - All foreign keys and commonly queried fields are indexed
2. **Bulk Updates** - Use the bulk update endpoint for drag & drop to minimize queries
3. **Caching** - Consider caching widget types (rarely change)
4. **Pagination** - Implement pagination for large dashboard lists

## Troubleshooting

### Migration Issues

If the migration fails:
1. Check that uuid-ossp extension is available
2. Verify user table exists (required for foreign keys)
3. Check PostgreSQL logs for specific errors

### Seed Issues

If seeding fails:
1. Ensure database connection is configured in `.env`
2. Verify migration ran successfully
3. Check for duplicate widget type names

### Permission Errors

If users can't access dashboards:
1. Verify JWT token is valid
2. Check dashboard ownership
3. Verify share records exist with correct permissions

## Next Steps

1. Build frontend components for each widget type
2. Implement real-time data fetching based on data_source_config
3. Add drag & drop UI using React Grid Layout
4. Implement widget configuration UI
5. Add dashboard templates for quick setup
