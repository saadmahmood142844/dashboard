# Widget System Setup Guide

## Setup Instructions

The widget system is integrated into your existing database structure. Everything is created automatically!

### Step 1: Run Seed Script

```bash
node backend/scripts/seed.js
```

This will:
- Create all database tables (including widget system)
- Seed 11 widget types
- Create sample data

### Step 2: Start Server

```bash
npm start
```

### Step 3: Test APIs

Import the Postman collection and test:
```
backend/postman/10_Widget_System.postman_collection.json
```

That's it! 🎉

## What Got Created

### Database Tables
- `widget_types` - 11 pre-built widget types
- `widget_definitions` - User-created widgets
- `dashboards` - Dashboard containers
- `dashboard_layouts` - Widget positions
- `dashboard_shares` - Sharing permissions

### API Routes
- `/api/widget-types`
- `/api/widget-definitions`
- `/api/dashboards`
- `/api/dashboard-layouts`

### Models
- WidgetType
- WidgetDefinition
- Dashboard
- DashboardLayout
- DashboardShare

## Widget Types Created

1. **line_chart** - Line charts (supports oil/gas/water)
2. **gauge** - Gauges
3. **bar_chart** - Bar charts
4. **kpi** - KPIs
5. **table** - Tables
6. **pie_chart** - Pie charts
7. **map** - Maps
8. **area_chart** - Area charts
9. **donut_chart** - Donut charts
10. **stacked_bar** - Stacked bars
11. **alarms_table** - Alarms

## Verify Installation

Check database:
```sql
SELECT COUNT(*) FROM widget_types;
-- Should return 11
```

Test API:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/widget-types
```

## Frontend Integration

See `../FRONTEND_INTEGRATION.md` for:
- React Grid Layout setup
- Widget component creation
- Dashboard management UI
- Drag & drop implementation

## Complete Documentation

- `../WIDGET_SYSTEM_SUMMARY.md` - Full system overview
- `../FRONTEND_INTEGRATION.md` - Frontend guide
- `API_QUICK_REFERENCE.md` - API reference
- `../SETUP_CHECKLIST.md` - Detailed checklist
