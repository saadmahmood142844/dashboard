# Current Dashboard Widget Configuration

## Overview

This document shows the exact configuration of all 10 widgets stored in your database, matching your current dashboard layout.

## Widget Sequence

The widgets are displayed in this exact order (by `display_order` field):

### 1. OFR KPI Card
```json
{
  "name": "OFR KPI Card",
  "description": "Oil Flow Rate KPI metric card",
  "widget_type": "kpi",
  "component_name": "KPIWidget",
  "data_source_config": {
    "metric": "ofr",
    "unit": "l/min"
  },
  "layout_config": {
    "x": 0,
    "y": 0,
    "w": 3,
    "h": 2,
    "minW": 2,
    "minH": 2
  },
  "display_order": 1
}
```

### 2. WFR KPI Card
```json
{
  "name": "WFR KPI Card",
  "description": "Water Flow Rate KPI metric card",
  "widget_type": "kpi",
  "component_name": "KPIWidget",
  "data_source_config": {
    "metric": "wfr",
    "unit": "l/min"
  },
  "layout_config": {
    "x": 3,
    "y": 0,
    "w": 3,
    "h": 2,
    "minW": 2,
    "minH": 2
  },
  "display_order": 2
}
```

### 3. GFR KPI Card
```json
{
  "name": "GFR KPI Card",
  "description": "Gas Flow Rate KPI metric card",
  "widget_type": "kpi",
  "component_name": "KPIWidget",
  "data_source_config": {
    "metric": "gfr",
    "unit": "l/min"
  },
  "layout_config": {
    "x": 6,
    "y": 0,
    "w": 3,
    "h": 2,
    "minW": 2,
    "minH": 2
  },
  "display_order": 3
}
```

### 4. Last Refresh Card
```json
{
  "name": "Last Refresh Card",
  "description": "Last data refresh timestamp card",
  "widget_type": "kpi",
  "component_name": "KPIWidget",
  "data_source_config": {
    "metric": "last_refresh"
  },
  "layout_config": {
    "x": 9,
    "y": 0,
    "w": 3,
    "h": 2,
    "minW": 2,
    "minH": 2
  },
  "display_order": 4
}
```

### 5. OFR Line Chart
```json
{
  "name": "OFR Line Chart",
  "description": "Oil Flow Rate trend line chart",
  "widget_type": "line_chart",
  "component_name": "LineChartWidget",
  "data_source_config": {
    "metric": "ofr",
    "timeRange": "dynamic",
    "yAxisLabel": "OFR (l/min)",
    "showOil": true,
    "showGas": false,
    "showWater": false
  },
  "layout_config": {
    "x": 0,
    "y": 2,
    "w": 6,
    "h": 4,
    "minW": 4,
    "minH": 3
  },
  "display_order": 5
}
```

### 6. WFR Line Chart
```json
{
  "name": "WFR Line Chart",
  "description": "Water Flow Rate trend line chart",
  "widget_type": "line_chart",
  "component_name": "LineChartWidget",
  "data_source_config": {
    "metric": "wfr",
    "timeRange": "dynamic",
    "yAxisLabel": "WFR (l/min)",
    "showOil": false,
    "showGas": false,
    "showWater": true
  },
  "layout_config": {
    "x": 6,
    "y": 2,
    "w": 6,
    "h": 4,
    "minW": 4,
    "minH": 3
  },
  "display_order": 6
}
```

### 7. GFR Line Chart
```json
{
  "name": "GFR Line Chart",
  "description": "Gas Flow Rate trend line chart",
  "widget_type": "line_chart",
  "component_name": "LineChartWidget",
  "data_source_config": {
    "metric": "gfr",
    "timeRange": "dynamic",
    "yAxisLabel": "GFR (l/min)",
    "showOil": false,
    "showGas": true,
    "showWater": false
  },
  "layout_config": {
    "x": 0,
    "y": 6,
    "w": 6,
    "h": 4,
    "minW": 4,
    "minH": 3
  },
  "display_order": 7
}
```

### 8. Fractions Chart
```json
{
  "name": "Fractions Chart",
  "description": "Production fractions (GVF/WLR) combined chart",
  "widget_type": "line_chart",
  "component_name": "LineChartWidget",
  "data_source_config": {
    "metric": "fractions",
    "metrics": ["gvf", "wlr"],
    "yAxisLabel": "Percentage (%)"
  },
  "layout_config": {
    "x": 6,
    "y": 6,
    "w": 6,
    "h": 4,
    "minW": 4,
    "minH": 3
  },
  "display_order": 8
}
```

### 9. Top Regions Pie Chart
```json
{
  "name": "Top Regions Pie Chart",
  "description": "Top producing regions distribution",
  "widget_type": "pie_chart",
  "component_name": "PieChartWidget",
  "data_source_config": {
    "dataType": "hierarchy",
    "aggregation": "region"
  },
  "layout_config": {
    "x": 0,
    "y": 10,
    "w": 6,
    "h": 5,
    "minW": 4,
    "minH": 4
  },
  "display_order": 9
}
```

### 10. Production Map
```json
{
  "name": "Production Map",
  "description": "Geographic production visualization map",
  "widget_type": "map",
  "component_name": "MapWidget",
  "data_source_config": {
    "showDevices": true,
    "showHierarchy": true,
    "clusterMarkers": true
  },
  "layout_config": {
    "x": 0,
    "y": 15,
    "w": 12,
    "h": 6,
    "minW": 6,
    "minH": 4
  },
  "display_order": 10
}
```

## Grid Layout System

The dashboard uses a 12-column grid system:

```
Grid Configuration:
- Columns: 12
- Row Height: 100px
- Margin: [10, 10]
- Breakpoints:
  - lg: 1200px
  - md: 996px
  - sm: 768px
  - xs: 480px
  - xxs: 0px
```

## Layout Visualization

```
┌─────────────────────────────────────────────────────────┐
│  Row 0-1: KPI Cards (4 widgets, 3 columns each)        │
├──────────────┬──────────────┬──────────────┬───────────┤
│ OFR (0-2)    │ WFR (3-5)    │ GFR (6-8)    │ Refresh   │
│              │              │              │ (9-11)    │
├──────────────┴──────────────┴──────────────┴───────────┤
│  Row 2-5: Line Charts (2 rows, 2 widgets)              │
├──────────────────────────────┬─────────────────────────┤
│ OFR Chart (0-5)              │ WFR Chart (6-11)        │
│                              │                         │
├──────────────────────────────┼─────────────────────────┤
│ GFR Chart (0-5)              │ Fractions (6-11)        │
│                              │                         │
├──────────────────────────────┴─────────────────────────┤
│  Row 10-14: Pie Chart                                  │
├────────────────────────────────────────────────────────┤
│ Top Regions Pie Chart (0-5)                            │
│                                                        │
├────────────────────────────────────────────────────────┤
│  Row 15-20: Map                                        │
├────────────────────────────────────────────────────────┤
│ Production Map (0-11, full width)                      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Data Source Configurations

### KPI Widgets
- **metric**: The metric to display (ofr, wfr, gfr, last_refresh)
- **unit**: Unit of measurement (l/min)

### Line Chart Widgets
- **metric**: Primary metric to chart
- **timeRange**: "dynamic" (uses dashboard time selector)
- **yAxisLabel**: Y-axis label text
- **showOil/showGas/showWater**: Boolean flags for series display

### Fractions Chart
- **metric**: "fractions"
- **metrics**: Array of metrics to display ["gvf", "wlr"]
- **yAxisLabel**: "Percentage (%)"

### Pie Chart
- **dataType**: "hierarchy"
- **aggregation**: "region" (aggregate by region level)

### Map Widget
- **showDevices**: Display device markers
- **showHierarchy**: Display hierarchy structure
- **clusterMarkers**: Enable marker clustering

## Customization

To modify widget configuration:

1. Update database directly:
   ```sql
   UPDATE widget_definitions
   SET data_source_config = '{"metric": "new_value"}'
   WHERE name = 'Widget Name';
   ```

2. Or update via API:
   ```http
   PUT /api/widget-definitions/:id
   Content-Type: application/json

   {
     "data_source_config": {
       "metric": "new_value"
     }
   }
   ```

3. Or modify seed script and re-run:
   ```bash
   cd backend
   npm run seed:dashboard
   ```

---

**Note**: This configuration is loaded dynamically on dashboard mount. Any changes to the database will be reflected on next page load.
