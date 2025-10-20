# Widget System - Backend Documentation

## What This System Does

This backend provides a complete API for building customizable, drag-and-drop dashboards. Users can:
- Browse available widget types (charts, gauges, tables, etc.)
- Create custom widget definitions with their own data sources
- Build personalized dashboards by arranging widgets
- Share dashboards with team members with granular permissions
- Save and restore dashboard layouts

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  (React Grid Layout + Widget Components)                     │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/JSON
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Express)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Widget Types Routes (/api/widget-types)             │  │
│  │  Widget Definitions Routes (/api/widget-definitions) │  │
│  │  Dashboards Routes (/api/dashboards)                 │  │
│  │  Dashboard Layouts Routes (/api/dashboard-layouts)   │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↕                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Models Layer                                         │  │
│  │  - WidgetType                                         │  │
│  │  - WidgetDefinition                                   │  │
│  │  - Dashboard                                          │  │
│  │  - DashboardLayout                                    │  │
│  │  - DashboardShare                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ SQL
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  - widget_types (catalog)                                    │
│  - widget_definitions (user instances)                       │
│  - dashboards (containers)                                   │
│  - dashboard_layouts (positions)                             │
│  - dashboard_shares (permissions)                            │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
backend/
├── migrations/
│   └── 001_create_widget_system.sql      # Database schema
├── models/
│   ├── WidgetType.js                     # Widget type catalog
│   ├── WidgetDefinition.js               # User widget instances
│   ├── Dashboard.js                      # Dashboard containers
│   ├── DashboardLayout.js                # Widget positions
│   └── DashboardShare.js                 # Sharing permissions
├── routes/
│   ├── widgetTypes.js                    # Widget type endpoints
│   ├── widgetDefinitions.js              # Widget definition endpoints
│   ├── dashboards.js                     # Dashboard endpoints
│   └── dashboardLayouts.js               # Layout endpoints
├── scripts/
│   ├── seedWidgets.js                    # Seed widget types
│   └── setupWidgetSystem.js              # One-command setup
├── postman/
│   └── 10_Widget_System.postman_collection.json
├── WIDGET_SYSTEM_SETUP.md                # Setup instructions
├── API_QUICK_REFERENCE.md                # API documentation
└── .env.example                          # Environment template
```

## Database Schema

### widget_types
Catalog of available widget component types.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(100) | Unique identifier (e.g., 'line_chart') |
| component_name | VARCHAR(100) | React component name |
| default_config | JSONB | Default configuration |
| created_at | TIMESTAMPTZ | Creation timestamp |

**Pre-seeded types**: gauge, line_chart, bar_chart, kpi, table, pie_chart, map, area_chart, donut_chart, stacked_bar, alarms_table, flow_rate_chart

### widget_definitions
User-created instances of widget types with custom data sources.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(200) | Widget name |
| description | TEXT | Description |
| widget_type_id | UUID | FK to widget_types |
| data_source_config | JSONB | API endpoint, params, refresh interval |
| layout_config | JSONB | Default position and size |
| created_by | BIGINT | FK to users |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### dashboards
Dashboard containers with grid configuration.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(200) | Dashboard name |
| description | TEXT | Description |
| version | INTEGER | Version number (auto-incremented) |
| is_active | BOOLEAN | Active status |
| grid_config | JSONB | Grid layout settings |
| created_by | BIGINT | FK to users |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### dashboard_layouts
Widget positions and configurations within dashboards.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| dashboard_id | UUID | FK to dashboards |
| widget_definition_id | UUID | FK to widget_definitions |
| layout_config | JSONB | Position (x, y, w, h, min/max) |
| instance_config | JSONB | Widget-specific overrides |
| display_order | INTEGER | Display order |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### dashboard_shares
Dashboard sharing and permissions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| dashboard_id | UUID | FK to dashboards |
| user_id | BIGINT | FK to users |
| permission_level | VARCHAR(20) | 'view', 'edit', 'admin' |
| shared_by | BIGINT | FK to users (sharer) |
| shared_at | TIMESTAMPTZ | Share timestamp |
| expires_at | TIMESTAMPTZ | Optional expiration |

## API Endpoints Summary

### Widget Types (4 endpoints)
- `GET /api/widget-types` - List all
- `GET /api/widget-types/:id` - Get one
- `POST /api/widget-types` - Create (admin only)
- `PUT /api/widget-types/:id` - Update (admin only)

### Widget Definitions (5 endpoints)
- `GET /api/widget-definitions` - List all
- `GET /api/widget-definitions/:id` - Get one
- `POST /api/widget-definitions` - Create
- `PUT /api/widget-definitions/:id` - Update
- `DELETE /api/widget-definitions/:id` - Delete

### Dashboards (8 endpoints)
- `GET /api/dashboards` - List user's dashboards
- `GET /api/dashboards/:id` - Get with layouts
- `POST /api/dashboards` - Create
- `PUT /api/dashboards/:id` - Update
- `DELETE /api/dashboards/:id` - Delete
- `POST /api/dashboards/:id/duplicate` - Clone
- `POST /api/dashboards/:id/share` - Share
- `DELETE /api/dashboards/:id/share/:userId` - Revoke

### Dashboard Layouts (6 endpoints)
- `GET /api/dashboard-layouts/dashboard/:id` - Get all
- `GET /api/dashboard-layouts/:id` - Get one
- `POST /api/dashboard-layouts` - Add widget
- `PUT /api/dashboard-layouts/:id` - Update
- `PUT /api/dashboard-layouts/dashboard/:id/bulk` - Bulk update
- `DELETE /api/dashboard-layouts/:id` - Remove

## Models API

### WidgetType Model

```javascript
// Create
await WidgetType.create({
  name: 'custom_chart',
  component_name: 'CustomChartWidget',
  default_config: { showLegend: true }
});

// Find
const type = await WidgetType.findById(id);
const type = await WidgetType.findByName('line_chart');
const types = await WidgetType.findAll();

// Update
await WidgetType.update(id, { name: 'new_name' });

// Delete
await WidgetType.delete(id);
```

### WidgetDefinition Model

```javascript
// Create
await WidgetDefinition.create({
  name: 'Oil Production',
  widget_type_id: typeId,
  data_source_config: {
    endpoint: '/api/charts/oil',
    refreshInterval: 30000
  },
  created_by: userId
});

// Find
const def = await WidgetDefinition.findById(id);
const defs = await WidgetDefinition.findAll({ created_by: userId });

// Update
await WidgetDefinition.update(id, { name: 'New Name' });
```

### Dashboard Model

```javascript
// Create
await Dashboard.create({
  name: 'Production Overview',
  grid_config: { cols: 12, rowHeight: 100 },
  created_by: userId
});

// Find
const dashboard = await Dashboard.findById(id);
const dashboards = await Dashboard.findByUserId(userId, true);

// Update
await Dashboard.update(id, { name: 'Updated Name' });

// Version control
await Dashboard.incrementVersion(id);
```

### DashboardLayout Model

```javascript
// Create
await DashboardLayout.create({
  dashboard_id: dashId,
  widget_definition_id: widgetId,
  layout_config: { x: 0, y: 0, w: 6, h: 3 }
});

// Find
const layouts = await DashboardLayout.findByDashboardId(dashId);

// Bulk update (for drag & drop)
await DashboardLayout.bulkUpdateLayouts(dashId, [
  { id: layout1Id, layout_config: { x: 0, y: 0, w: 4, h: 2 } },
  { id: layout2Id, layout_config: { x: 4, y: 0, w: 8, h: 3 } }
]);
```

### DashboardShare Model

```javascript
// Share
await DashboardShare.create({
  dashboard_id: dashId,
  user_id: shareWithUserId,
  permission_level: 'view',
  shared_by: currentUserId
});

// Check permission
const permission = await DashboardShare.checkPermission(dashId, userId);
// Returns: 'view', 'edit', 'admin', or null

// Revoke
await DashboardShare.revokeAccess(dashId, userId);
```

## Configuration Objects

### data_source_config
Tells frontend how to fetch data for the widget.

```json
{
  "endpoint": "/api/charts/production-data",
  "method": "GET",
  "refreshInterval": 30000,
  "params": {
    "timeRange": "24h",
    "deviceId": "dynamic"
  },
  "headers": {
    "Custom-Header": "value"
  },
  "dataMapping": {
    "x": "timestamp",
    "y": "value"
  }
}
```

### layout_config
Defines widget position in grid (React Grid Layout format).

```json
{
  "x": 0,
  "y": 0,
  "w": 6,
  "h": 3,
  "minW": 4,
  "minH": 2,
  "maxW": 12,
  "maxH": 10,
  "static": false
}
```

### instance_config
Widget-specific settings that override defaults.

```json
{
  "title": "Custom Widget Title",
  "color": "#3b82f6",
  "showLegend": false,
  "thresholds": {
    "warning": 70,
    "critical": 90
  }
}
```

### grid_config
Dashboard-level grid configuration.

```json
{
  "cols": 12,
  "rowHeight": 100,
  "margin": [10, 10],
  "breakpoints": {
    "lg": 1200,
    "md": 996,
    "sm": 768,
    "xs": 480,
    "xxs": 0
  },
  "containerPadding": [10, 10]
}
```

## Security

### Authentication
All endpoints require valid JWT token:
```javascript
Authorization: Bearer <token>
```

### Authorization
- Users can only modify their own widgets and dashboards
- Dashboard owners can share with specific permissions
- Admin role can manage widget types

### Permission Levels
- **view** - Read-only access to dashboard
- **edit** - Can modify widget positions and settings
- **admin** - Full control including sharing

## Common Operations

### Creating a Complete Dashboard

```javascript
// 1. Create widget definitions
const widget1 = await WidgetDefinition.create({
  name: 'Oil Chart',
  widget_type_id: lineChartTypeId,
  data_source_config: { endpoint: '/api/charts/oil' },
  created_by: userId
});

// 2. Create dashboard with widgets
const dashboard = await Dashboard.create({
  name: 'Production Dashboard',
  created_by: userId
});

// 3. Add widgets to dashboard
await DashboardLayout.create({
  dashboard_id: dashboard.id,
  widget_definition_id: widget1.id,
  layout_config: { x: 0, y: 0, w: 6, h: 3 }
});
```

### Handling Drag & Drop

```javascript
// Frontend sends updated positions
await DashboardLayout.bulkUpdateLayouts(dashboardId, [
  { id: layout1, layout_config: { x: 0, y: 0, w: 4, h: 2 } },
  { id: layout2, layout_config: { x: 4, y: 0, w: 8, h: 3 } }
]);

// Dashboard version automatically increments
await Dashboard.incrementVersion(dashboardId);
```

### Sharing a Dashboard

```javascript
// Share with edit permission
await DashboardShare.create({
  dashboard_id: dashboardId,
  user_id: recipientId,
  permission_level: 'edit',
  shared_by: currentUserId,
  expires_at: null // No expiration
});

// Check if user has access
const permission = await DashboardShare.checkPermission(
  dashboardId,
  userId
);

if (permission === 'edit') {
  // User can modify layout
}
```

## Testing

### Unit Testing Models

```javascript
const assert = require('assert');

// Test widget type creation
const type = await WidgetType.create({
  name: 'test_widget',
  component_name: 'TestWidget',
  default_config: {}
});
assert(type.id);
assert(type.name === 'test_widget');

// Clean up
await WidgetType.delete(type.id);
```

### Integration Testing APIs

Use the included Postman collection:
1. Import `postman/10_Widget_System.postman_collection.json`
2. Set authentication token
3. Run all tests
4. Verify responses

## Performance

### Indexes
All foreign keys and commonly queried fields are indexed:
- widget_definitions(created_by)
- dashboard_layouts(dashboard_id)
- dashboard_shares(user_id)

### Bulk Operations
Use bulk update endpoint for drag & drop to minimize queries:
- Single transaction for multiple layout updates
- Atomic operation - all or nothing

### Caching Recommendations
- Cache widget types (rarely change)
- Cache user's widget definitions
- Invalidate dashboard cache on layout changes

## Troubleshooting

### "Widget type not found"
- Run seed script: `node scripts/seedWidgets.js`
- Check: `SELECT * FROM widget_types;`

### "Permission denied"
- Verify JWT token is valid
- Check dashboard ownership
- Verify share records exist

### "Cannot add widget to dashboard"
- Ensure widget definition exists
- Check user has edit permission
- Verify dashboard is active

## Development Tips

### Adding a New Widget Type

1. Add to seed script:
```javascript
{
  name: 'new_widget',
  component_name: 'NewWidget',
  default_config: { /* defaults */ }
}
```

2. Run seed: `node scripts/seedWidgets.js`

3. Create frontend component with matching name

### Customizing Permissions

Modify `checkPermission` in routes to add custom logic:
```javascript
if (customCondition) {
  return { allowed: true, dashboard };
}
```

### Adding Audit Logs

Extend models to log changes:
```javascript
static async update(id, data) {
  // Perform update
  await AuditLog.create({
    entity: 'widget_definition',
    entity_id: id,
    action: 'update',
    changes: data
  });
}
```

## Support

For issues or questions:
1. Check documentation in repository root
2. Review error messages in console
3. Check PostgreSQL logs
4. Verify all setup steps completed

## License

Same as main project.
