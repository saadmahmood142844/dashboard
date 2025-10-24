# Dynamic Widget Loading - Setup and Verification Guide

## Overview
Your dashboard now loads widgets dynamically from the database. All 10 widgets are fetched from the `dashboard_layouts` table and rendered based on their configuration.

## What Was Fixed

### 1. **Dashboard Name Mismatch**
- **Problem**: Frontend searched for "Default Production Dashboard", but the database had "Production Dashboard"
- **Solution**: Updated frontend to search for "Production Dashboard" or "Production Overview" with multiple fallbacks

### 2. **TypeScript Type Mismatch**
- **Problem**: Dashboard IDs are UUIDs (strings) in the database, but the frontend expected numbers
- **Solution**: Updated TypeScript interfaces to use `string` for dashboard IDs

### 3. **Widget Rendering**
- **Problem**: Widgets were loaded but never rendered (only logged to console)
- **Solution**:
  - Completely rewrote `WidgetRenderer.tsx` to handle all 10 widget types
  - Replaced hardcoded components with dynamic grid-based rendering
  - Implemented CSS Grid layout that respects widget positions from database

### 4. **Duplicate Dashboards**
- **Problem**: Multiple dashboard runs created 6 duplicate dashboards
- **Solution**: Created cleanup script to remove duplicates

## Testing Instructions

### Step 1: Clean Up Duplicate Dashboards (Optional)
```bash
cd backend
node scripts/cleanupDuplicateDashboards.js
```

This will:
- Find all "Production Dashboard" instances
- Keep the one with the most widgets
- Delete duplicates

### Step 2: Verify Database Widgets
Run this query in your PostgreSQL database:
```sql
SELECT
  dl.display_order,
  wd.name,
  wt.name as type,
  dl.layout_config->>'x' as x,
  dl.layout_config->>'y' as y,
  dl.layout_config->>'w' as width,
  dl.layout_config->>'h' as height
FROM dashboard_layouts dl
JOIN widget_definitions wd ON dl.widget_definition_id = wd.id
JOIN widget_types wt ON wd.widget_type_id = wt.id
WHERE dl.dashboard_id = (
  SELECT id FROM dashboards WHERE name = 'Production Dashboard' LIMIT 1
)
ORDER BY dl.display_order;
```

Expected output: 10 widgets with proper x, y, width, and height values.

### Step 3: Start the Application
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 4: Check Browser Console
After logging in, you should see in the browser console:
```
🔄 Loading dashboard widgets from database...
📊 Dashboards received: (1) [{...}]
✅ Selected dashboard: Production Dashboard (ID: xxx-xxx-xxx-xxx)
📦 Widget layouts loaded: 10
🎨 Widget configurations from database:
  1. Oil Flow Rate Card (kpi)
     Position: x=0, y=0, w=3, h=2
     Config: {metric: 'total_ofr', unit: 'l/min', label: 'Total OFR'}
  2. Water Flow Rate Card (kpi)
     Position: x=3, y=0, w=3, h=2
     Config: {metric: 'total_wfr', unit: 'l/min', label: 'Total WFR'}
  ... (8 more widgets)
```

### Step 5: Verify Visual Display
The dashboard should show:
1. **Top Row (4 KPI cards)**:
   - Oil Flow Rate Card
   - Water Flow Rate Card
   - Gas Flow Rate Card
   - Last Refresh Time

2. **Middle Section (3 Flow Rate Charts)**:
   - OFR Trend Chart (left half)
   - WFR Trend Chart (right half)
   - GFR Trend Chart (full width)

3. **Bottom Section (3 Analysis Widgets)**:
   - Production Fractions Chart (left half)
   - GVF and WLR Gauges (right half)
   - Production Map View (full width)

## Widget Configuration

Each widget in the database has:
- **Position**: `x`, `y` coordinates on 12-column grid
- **Size**: `w` (width in columns), `h` (height in row units)
- **Type**: `kpi`, `line_chart`, `donut_chart`, or `map`
- **Data Config**: Specifies which metric to display and how

## Troubleshooting

### No Widgets Loading
1. Check if dashboards exist:
   ```sql
   SELECT * FROM dashboards WHERE name = 'Production Dashboard';
   ```
2. If empty, run seeding script:
   ```bash
   cd backend
   node scripts/seedAllData.js
   ```

### Widgets Load But Don't Display
1. Check browser console for errors
2. Verify widget types match in `WidgetRenderer.tsx`
3. Check that `data_source_config` has required fields

### Wrong Dashboard Selected
- Frontend looks for dashboards in this priority:
  1. Name = "Production Dashboard"
  2. Name = "Production Overview"
  3. First active dashboard
  4. First dashboard in list

### Chart Sizing Issues (Recharts Warning)
This is normal and will resolve once data loads. The warning appears because charts initialize with 0 dimensions before container sizes are calculated.

## API Endpoints Used

1. **GET /dashboards** - Fetch user's dashboards
2. **GET /dashboard-layouts/dashboard/:dashboardId** - Fetch widgets for a dashboard

## Database Schema

### Key Tables
- `dashboards` - Dashboard metadata
- `widget_types` - Available widget types (kpi, line_chart, etc.)
- `widget_definitions` - Widget configurations
- `dashboard_layouts` - Widget instances and their positions

## Next Steps

### Adding New Widgets
1. Create widget definition in database
2. Add to `dashboard_layouts` with position
3. Implement rendering logic in `WidgetRenderer.tsx` if needed

### Customizing Layouts
Update the `layout_config` in the `dashboard_layouts` table:
```sql
UPDATE dashboard_layouts
SET layout_config = jsonb_set(
  layout_config,
  '{x}',
  '6'
)
WHERE id = 'widget-id';
```

## Performance Notes

- Widgets refresh every 5 seconds with latest data
- Initial load fetches all widget configs in one request
- Chart data is fetched separately based on selected device/hierarchy
- Mobile view uses single-column layout for better responsiveness

## Success Indicators

✅ Console shows "10 widgets loaded"
✅ All widgets render on the page
✅ No TypeScript errors
✅ Charts display data when device/hierarchy selected
✅ Time range selector updates chart widgets
✅ Responsive layout works on mobile

---

**Version**: 1.0.0 - Dynamic Widget System
**Last Updated**: 2025-10-24
