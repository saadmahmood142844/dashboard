# Widget System - Quick Reference

## Setup (Already Done!)

Widget system tables are automatically created when you run:
```bash
node backend/scripts/seed.js
```

## Widget Types (11 Total)

1. **line_chart** - Line charts (supports oil/gas/water flow rates)
2. **gauge** - Circular gauges
3. **bar_chart** - Bar charts
4. **kpi** - Key metrics
5. **table** - Data tables
6. **pie_chart** - Pie charts
7. **map** - Geographic maps
8. **area_chart** - Area charts
9. **donut_chart** - Donut charts
10. **stacked_bar** - Stacked bars
11. **alarms_table** - Alarms

## API Routes

- `/api/widget-types` - Browse widget catalog
- `/api/widget-definitions` - Create custom widgets
- `/api/dashboards` - Create & manage dashboards
- `/api/dashboard-layouts` - Arrange widgets

## Testing

Import: `backend/postman/10_Widget_System.postman_collection.json`

## Documentation

- `../WIDGET_SYSTEM_SUMMARY.md` - Full overview
- `../FRONTEND_INTEGRATION.md` - Frontend guide
- `API_QUICK_REFERENCE.md` - API docs
