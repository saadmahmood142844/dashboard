# Dashboard Widget Loading - Verification Guide

## How to Verify Widgets Are Loading from Database

### Step 1: Verify Database Configuration

Run the verification script to see what's stored in your database:

```bash
cd backend
npm run verify:dashboard
```

**Expected Output:**
```
========================================
DASHBOARD CONFIGURATION VERIFICATION
========================================

1️⃣  WIDGET TYPES
─────────────────────────────────────
Found 11 widget types:

  ✓ area_chart (AreaChartWidget)
  ✓ bar_chart (BarChartWidget)
  ✓ donut_chart (DonutChartWidget)
  ✓ gauge (GaugeWidget)
  ✓ kpi (KPIWidget)
  ✓ line_chart (LineChartWidget)
  ✓ map (MapWidget)
  ✓ pie_chart (PieChartWidget)
  ✓ stacked_bar (StackedBarWidget)
  ✓ table (TableWidget)

2️⃣  DASHBOARDS
─────────────────────────────────────
Found 1 dashboard(s):

  ✓ "Default Production Dashboard" (ID: 1)
    Description: Main production monitoring dashboard with KPIs, charts, and map
    Created: 2025-10-23...

3️⃣  WIDGET DEFINITIONS
─────────────────────────────────────
Found 10 widget definition(s):

  ✓ OFR KPI Card
    Type: kpi (KPIWidget)
    Config: { metric: 'ofr', unit: 'l/min' }

  ✓ WFR KPI Card
    Type: kpi (KPIWidget)
    Config: { metric: 'wfr', unit: 'l/min' }

  ✓ GFR KPI Card
    Type: kpi (KPIWidget)
    Config: { metric: 'gfr', unit: 'l/min' }

  ✓ Last Refresh Card
    Type: kpi (KPIWidget)
    Config: { metric: 'last_refresh' }

  ✓ OFR Line Chart
    Type: line_chart (LineChartWidget)
    Config: { metric: 'ofr', timeRange: 'dynamic', ... }

  ✓ WFR Line Chart
    Type: line_chart (LineChartWidget)
    Config: { metric: 'wfr', timeRange: 'dynamic', ... }

  ✓ GFR Line Chart
    Type: line_chart (LineChartWidget)
    Config: { metric: 'gfr', timeRange: 'dynamic', ... }

  ✓ Fractions Chart
    Type: line_chart (LineChartWidget)
    Config: { metric: 'fractions', metrics: ['gvf', 'wlr'], ... }

  ✓ GVF/WLR Donut Charts
    Type: donut_chart (DonutChartWidget)
    Config: { metrics: ['gvf', 'wlr'], ... }

  ✓ Production Map
    Type: map (MapWidget)
    Config: { showDevices: true, showHierarchy: true, ... }

4️⃣  DASHBOARD LAYOUTS - "Default Production Dashboard"
─────────────────────────────────────
Found 10 widget(s) in this dashboard:

  1. OFR KPI Card
     Type: kpi (KPIWidget)
     Position: x=0, y=0, w=3, h=2
     Display Order: 1
     Data Config: { metric: 'ofr', unit: 'l/min' }

  2. WFR KPI Card
     Type: kpi (KPIWidget)
     Position: x=3, y=0, w=3, h=2
     Display Order: 2
     Data Config: { metric: 'wfr', unit: 'l/min' }

  3. GFR KPI Card
     Type: kpi (KPIWidget)
     Position: x=6, y=0, w=3, h=2
     Display Order: 3
     Data Config: { metric: 'gfr', unit: 'l/min' }

  4. Last Refresh Card
     Type: kpi (KPIWidget)
     Position: x=9, y=0, w=3, h=2
     Display Order: 4
     Data Config: { metric: 'last_refresh' }

  5. OFR Line Chart
     Type: line_chart (LineChartWidget)
     Position: x=0, y=2, w=6, h=4
     Display Order: 5
     Data Config: { metric: 'ofr', timeRange: 'dynamic', ... }

  6. WFR Line Chart
     Type: line_chart (LineChartWidget)
     Position: x=6, y=2, w=6, h=4
     Display Order: 6
     Data Config: { metric: 'wfr', timeRange: 'dynamic', ... }

  7. GFR Line Chart
     Type: line_chart (LineChartWidget)
     Position: x=0, y=6, w=6, h=4
     Display Order: 7
     Data Config: { metric: 'gfr', timeRange: 'dynamic', ... }

  8. Fractions Chart
     Type: line_chart (LineChartWidget)
     Position: x=0, y=6, w=6, h=4
     Display Order: 8
     Data Config: { metric: 'fractions', metrics: ['gvf', 'wlr'] }

  9. GVF/WLR Donut Charts
     Type: donut_chart (DonutChartWidget)
     Position: x=6, y=6, w=6, h=4
     Display Order: 9
     Data Config: { metrics: ['gvf', 'wlr'], ... }

  10. Production Map
     Type: map (MapWidget)
     Position: x=0, y=15, w=12, h=6
     Display Order: 10
     Data Config: { showDevices: true, ... }

========================================
SUMMARY
========================================
✓ Widget Types: 11
✓ Dashboards: 1
✓ Widget Definitions: 10
✓ Widgets in "Default Production Dashboard": 10

========================================
✅ Dashboard configuration looks good!
```

### Step 2: Verify Frontend Loading

1. **Start the backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open browser and navigate to dashboard**

4. **Open Browser Console (F12)**

5. **Look for these logs:**

```
🔄 Loading dashboard widgets from database...
📊 Dashboards received: [{...}]
✅ Selected dashboard: Default Production Dashboard (ID: 1)
📦 Widget layouts loaded: 10
🎨 Widget configurations from database:
  1. OFR KPI Card (kpi)
     Position: x=0, y=0, w=3, h=2
     Config: {metric: 'ofr', unit: 'l/min'}
  2. WFR KPI Card (kpi)
     Position: x=3, y=0, w=3, h=2
     Config: {metric: 'wfr', unit: 'l/min'}
  3. GFR KPI Card (kpi)
     Position: x=6, y=0, w=3, h=2
     Config: {metric: 'gfr', unit: 'l/min'}
  4. Last Refresh Card (kpi)
     Position: x=9, y=0, w=3, h=2
     Config: {metric: 'last_refresh'}
  5. OFR Line Chart (line_chart)
     Position: x=0, y=2, w=6, h=4
     Config: {metric: 'ofr', timeRange: 'dynamic', ...}
  6. WFR Line Chart (line_chart)
     Position: x=6, y=2, w=6, h=4
     Config: {metric: 'wfr', timeRange: 'dynamic', ...}
  7. GFR Line Chart (line_chart)
     Position: x=0, y=6, w=6, h=4
     Config: {metric: 'gfr', timeRange: 'dynamic', ...}
  8. Fractions Chart (line_chart)
     Position: x=0, y=6, w=6, h=4
     Config: {metric: 'fractions', metrics: ['gvf', 'wlr']}
  9. GVF/WLR Donut Charts (donut_chart)
     Position: x=6, y=6, w=6, h=4
     Config: {metrics: ['gvf', 'wlr'], ...}
  10. Production Map (map)
     Position: x=0, y=15, w=12, h=6
     Config: {showDevices: true, ...}
```

### Step 3: Verify Visual Indicators

On the dashboard, you should see:

1. **Loading State** (briefly):
   - Spinner with text "Loading dashboard..."

2. **After Loading**:
   - Green badge showing "10 widgets loaded"
   - All widgets display normally

### Step 4: Verify API Calls

In the Network tab of browser DevTools:

1. Look for these API calls:
   ```
   GET /api/dashboards
   Status: 200
   Response: Array of dashboards

   GET /api/dashboard-layouts/dashboard/1
   Status: 200
   Response: Array of 10 widget layouts
   ```

2. Click on each call to inspect the response

## What to Look For

### ✅ Success Indicators

- [ ] Verification script shows 10 widgets configured
- [ ] Console logs show "🎨 Widget configurations from database:"
- [ ] Green badge shows "10 widgets loaded"
- [ ] Network tab shows successful API calls
- [ ] Widget positions match database configuration

### ❌ Failure Indicators

- [ ] Console shows "❌ Failed to load dashboard widgets"
- [ ] Badge shows "0 widgets loaded" or missing
- [ ] Network tab shows 404 or 500 errors
- [ ] Dashboard doesn't load at all

## Troubleshooting

### Issue: "0 widgets loaded"

**Cause:** Database not seeded

**Fix:**
```bash
cd backend
npm run seed:widgets
npm run seed:dashboard
npm run verify:dashboard
```

### Issue: Console shows API errors

**Cause:** Backend not running or database connection failed

**Fix:**
- Check backend is running: `ps aux | grep node`
- Check PostgreSQL: `pg_isready`
- Verify DATABASE_URL in `backend/.env`

### Issue: No console logs at all

**Cause:** Authentication issue or component not mounting

**Fix:**
- Check you're logged in
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)

## Proof of Database Loading

The console logs provide definitive proof that widgets are loaded from the database because:

1. **Widget names** come directly from database records
2. **Widget types** are fetched from the `widget_types` table
3. **Position data** (x, y, w, h) is stored in `dashboard_layouts`
4. **Data configurations** are stored in `widget_definitions`
5. **All data** is fetched via API calls visible in Network tab

## Direct Database Query

You can also verify by querying the database directly:

```bash
psql -U postgres -d saher-dashboard -c "
SELECT
  dl.display_order,
  wd.name as widget_name,
  wt.name as widget_type,
  dl.layout_config->>'w' as width,
  dl.layout_config->>'h' as height
FROM dashboard_layouts dl
JOIN widget_definitions wd ON dl.widget_definition_id = wd.id
JOIN widget_types wt ON wd.widget_type_id = wt.id
WHERE dl.dashboard_id = 1
ORDER BY dl.display_order;
"
```

Expected output:
```
 display_order |     widget_name      | widget_type | width | height
---------------+----------------------+-------------+-------+--------
             1 | OFR KPI Card        | kpi         | 3     | 2
             2 | WFR KPI Card        | kpi         | 3     | 2
             3 | GFR KPI Card        | kpi         | 3     | 2
             4 | Last Refresh Card   | kpi         | 3     | 2
             5 | OFR Line Chart      | line_chart  | 6     | 4
             6 | WFR Line Chart      | line_chart  | 6     | 4
             7 | GFR Line Chart      | line_chart  | 6     | 4
             8 | Fractions Chart     | line_chart  | 6     | 4
             9 | GVF/WLR Donut Charts| donut_chart | 6     | 4
            10 | Production Map      | map         | 12    | 6
```

---

**Summary:** All three verification methods (backend script, browser console, network tab) should show that widgets are being loaded from the PostgreSQL database with their exact configurations including positions, sizes, and data source configs.
