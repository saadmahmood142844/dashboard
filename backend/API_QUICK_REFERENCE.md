# Widget System API Quick Reference

## Authentication
All endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

## Widget Types

### List All Types
```http
GET /api/widget-types
```

### Get Type by ID
```http
GET /api/widget-types/:id
```

### Create Type (Admin Only)
```http
POST /api/widget-types
Content-Type: application/json

{
  "name": "custom_chart",
  "component_name": "CustomChartWidget",
  "default_config": { "showLegend": true }
}
```

## Widget Definitions

### List All Definitions
```http
GET /api/widget-definitions
GET /api/widget-definitions?my_widgets=true
GET /api/widget-definitions?widget_type_id=<uuid>
```

### Create Definition
```http
POST /api/widget-definitions
Content-Type: application/json

{
  "name": "Oil Production Chart",
  "description": "Real-time monitoring",
  "widget_type_id": "uuid",
  "data_source_config": {
    "endpoint": "/api/charts/oil-production",
    "refreshInterval": 30000,
    "params": { "timeRange": "24h" }
  },
  "layout_config": {
    "w": 6, "h": 3, "minW": 4, "minH": 2
  }
}
```

### Update Definition
```http
PUT /api/widget-definitions/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "data_source_config": { "endpoint": "/new-endpoint" }
}
```

### Delete Definition
```http
DELETE /api/widget-definitions/:id
```

## Dashboards

### Get User's Dashboards
```http
GET /api/dashboards
GET /api/dashboards?include_shared=false
```

### Get Dashboard with Layouts
```http
GET /api/dashboards/:id
```
Returns:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Production Overview",
    "description": "...",
    "grid_config": { "cols": 12, "rowHeight": 100 },
    "layouts": [
      {
        "id": "layout-uuid",
        "widget_name": "Oil Chart",
        "component_name": "LineChartWidget",
        "layout_config": { "x": 0, "y": 0, "w": 6, "h": 3 },
        "data_source_config": { "endpoint": "..." }
      }
    ],
    "permission": "owner"
  }
}
```

### Create Dashboard
```http
POST /api/dashboards
Content-Type: application/json

{
  "name": "Production Overview",
  "description": "Main dashboard",
  "grid_config": { "cols": 12, "rowHeight": 100 }
}
```

### Create Dashboard with Widgets
```http
POST /api/dashboards
Content-Type: application/json

{
  "name": "Production Dashboard",
  "widgets": [
    {
      "widget_definition_id": "uuid",
      "layout_config": { "x": 0, "y": 0, "w": 6, "h": 3 }
    }
  ]
}
```

### Update Dashboard
```http
PUT /api/dashboards/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "is_active": true
}
```

### Duplicate Dashboard
```http
POST /api/dashboards/:id/duplicate
Content-Type: application/json

{
  "name": "Production Overview - Copy"
}
```

### Delete Dashboard
```http
DELETE /api/dashboards/:id
```

## Dashboard Sharing

### Get Shares
```http
GET /api/dashboards/:id/shares
```

### Share Dashboard
```http
POST /api/dashboards/:id/share
Content-Type: application/json

{
  "user_id": 2,
  "permission_level": "view",
  "expires_at": "2024-12-31T23:59:59Z"
}
```
Permission levels: `view`, `edit`, `admin`

### Revoke Access
```http
DELETE /api/dashboards/:id/share/:userId
```

## Dashboard Layouts

### Get Dashboard Layouts
```http
GET /api/dashboard-layouts/dashboard/:dashboardId
```

### Add Widget to Dashboard
```http
POST /api/dashboard-layouts
Content-Type: application/json

{
  "dashboard_id": "uuid",
  "widget_definition_id": "uuid",
  "layout_config": {
    "x": 0, "y": 0, "w": 6, "h": 3,
    "minW": 4, "minH": 2
  },
  "instance_config": {
    "title": "Custom Title"
  }
}
```

### Update Layout
```http
PUT /api/dashboard-layouts/:id
Content-Type: application/json

{
  "layout_config": { "x": 6, "y": 0, "w": 6, "h": 3 }
}
```

### Bulk Update (Drag & Drop)
```http
PUT /api/dashboard-layouts/dashboard/:dashboardId/bulk
Content-Type: application/json

{
  "layouts": [
    {
      "id": "layout-uuid-1",
      "layout_config": { "x": 0, "y": 0, "w": 4, "h": 2 }
    },
    {
      "id": "layout-uuid-2",
      "layout_config": { "x": 4, "y": 0, "w": 8, "h": 3 }
    }
  ]
}
```

### Remove Widget
```http
DELETE /api/dashboard-layouts/:id
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Server Error

## Layout Config Format
```json
{
  "x": 0,        // Column position (0-11 for 12-col grid)
  "y": 0,        // Row position
  "w": 6,        // Width in grid units
  "h": 3,        // Height in grid units
  "minW": 4,     // Minimum width
  "minH": 2,     // Minimum height
  "maxW": 12,    // Maximum width (optional)
  "maxH": 10,    // Maximum height (optional)
  "static": false // Cannot be moved/resized if true
}
```

## Data Source Config Format
```json
{
  "endpoint": "/api/charts/production",
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

## Common Use Cases

### 1. Create Complete Dashboard
```bash
# Step 1: Create widget definitions
POST /api/widget-definitions
# Save returned IDs

# Step 2: Create dashboard with widgets
POST /api/dashboards
{
  "name": "My Dashboard",
  "widgets": [
    { "widget_definition_id": "id1", "layout_config": {...} },
    { "widget_definition_id": "id2", "layout_config": {...} }
  ]
}
```

### 2. Handle Drag & Drop
```bash
# On drag stop, send bulk update
PUT /api/dashboard-layouts/dashboard/:id/bulk
{
  "layouts": [ /* all updated positions */ ]
}
```

### 3. Share Dashboard with Team
```bash
POST /api/dashboards/:id/share
{
  "user_id": 2,
  "permission_level": "edit"
}
```

## Testing with cURL

```bash
# Get widget types
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/widget-types

# Create widget definition
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Widget","widget_type_id":"uuid"}' \
  http://localhost:5000/api/widget-definitions

# Get dashboard
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/dashboards/uuid
```
