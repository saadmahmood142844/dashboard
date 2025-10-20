# Frontend Widget System Integration Guide

## Overview

This guide explains how to integrate the dynamic widget system into your frontend application. The backend provides APIs to manage widget types, definitions, dashboards, and layouts.

## Prerequisites

1. Backend widget system set up and running
2. React Grid Layout library installed (for drag & drop)
3. Authentication system in place

## Installation

```bash
npm install react-grid-layout
```

## Core Concepts

### 1. Widget Types
Built-in widget component types (gauge, chart, table, etc.) that define the rendering logic.

### 2. Widget Definitions
User-created instances of widget types with custom data sources and configurations.

### 3. Dashboards
Containers that hold multiple widgets with a grid layout system.

### 4. Dashboard Layouts
Positions and configurations of widgets within a specific dashboard.

## API Integration

### Fetching Widget Types

```typescript
// Get all available widget types
const fetchWidgetTypes = async () => {
  const response = await api.get('/api/widget-types');
  return response.data.data;
};
```

### Creating Widget Definitions

```typescript
const createWidgetDefinition = async (widgetData) => {
  const response = await api.post('/api/widget-definitions', {
    name: 'Oil Production Chart',
    description: 'Real-time oil production monitoring',
    widget_type_id: widgetTypeId,
    data_source_config: {
      endpoint: '/api/charts/oil-production',
      refreshInterval: 30000,
      params: { timeRange: '24h' }
    },
    layout_config: {
      w: 6,
      h: 3,
      minW: 4,
      minH: 2
    }
  });
  return response.data.data;
};
```

### Loading a Dashboard

```typescript
const loadDashboard = async (dashboardId: string) => {
  const response = await api.get(`/api/dashboards/${dashboardId}`);
  const dashboard = response.data.data;

  // Dashboard structure:
  // {
  //   id, name, description, grid_config,
  //   layouts: [
  //     {
  //       id, layout_config, instance_config,
  //       widget_name, widget_type_name, component_name,
  //       data_source_config
  //     }
  //   ]
  // }

  return dashboard;
};
```

### Updating Widget Positions (Drag & Drop)

```typescript
const updateLayouts = async (dashboardId: string, layouts: any[]) => {
  const response = await api.put(
    `/api/dashboard-layouts/dashboard/${dashboardId}/bulk`,
    {
      layouts: layouts.map(layout => ({
        id: layout.i,
        layout_config: {
          x: layout.x,
          y: layout.y,
          w: layout.w,
          h: layout.h
        }
      }))
    }
  );
  return response.data.data;
};
```

## React Grid Layout Integration

### Basic Dashboard Component

```typescript
import React, { useState, useEffect } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const DashboardView = ({ dashboardId }) => {
  const [dashboard, setDashboard] = useState(null);
  const [layouts, setLayouts] = useState([]);

  useEffect(() => {
    loadDashboard(dashboardId).then(data => {
      setDashboard(data);

      // Convert backend layout format to react-grid-layout format
      const gridLayouts = data.layouts.map(layout => ({
        i: layout.id,
        x: layout.layout_config.x,
        y: layout.layout_config.y,
        w: layout.layout_config.w,
        h: layout.layout_config.h,
        minW: layout.layout_config.minW,
        minH: layout.layout_config.minH,
        static: layout.layout_config.static || false
      }));

      setLayouts(gridLayouts);
    });
  }, [dashboardId]);

  const handleLayoutChange = (newLayout) => {
    setLayouts(newLayout);

    // Save to backend
    updateLayouts(dashboardId, newLayout);
  };

  const renderWidget = (layoutItem) => {
    const widgetData = dashboard.layouts.find(l => l.id === layoutItem.i);

    // Dynamically render based on component_name
    const WidgetComponent = getWidgetComponent(widgetData.component_name);

    return (
      <div key={layoutItem.i} className="widget-container">
        <WidgetComponent
          config={widgetData.instance_config}
          dataSource={widgetData.data_source_config}
        />
      </div>
    );
  };

  if (!dashboard) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h1>{dashboard.name}</h1>
      <GridLayout
        className="layout"
        layout={layouts}
        cols={dashboard.grid_config.cols}
        rowHeight={dashboard.grid_config.rowHeight}
        width={1200}
        onLayoutChange={handleLayoutChange}
        isDraggable={true}
        isResizable={true}
      >
        {layouts.map(renderWidget)}
      </GridLayout>
    </div>
  );
};
```

### Widget Component Mapping

```typescript
import GaugeWidget from './widgets/GaugeWidget';
import LineChartWidget from './widgets/LineChartWidget';
import KPIWidget from './widgets/KPIWidget';
// ... import other widgets

const widgetComponents = {
  GaugeWidget,
  LineChartWidget,
  BarChartWidget,
  KPIWidget,
  TableWidget,
  PieChartWidget,
  MapWidget,
  AreaChartWidget,
  DonutChartWidget,
  StackedBarWidget,
  AlarmsTableWidget,
  FlowRateChartWidget
};

const getWidgetComponent = (componentName: string) => {
  return widgetComponents[componentName] || DefaultWidget;
};
```

### Example Widget Component

```typescript
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const LineChartWidget = ({ config, dataSource }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get(dataSource.endpoint, {
          params: dataSource.params
        });
        setData(response.data.data);
      } catch (error) {
        console.error('Error fetching widget data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up auto-refresh if configured
    if (dataSource.refreshInterval) {
      const interval = setInterval(fetchData, dataSource.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [dataSource]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="line-chart-widget">
      <h3>{config.title || 'Chart'}</h3>
      {/* Render your chart here using data */}
      <LineChart data={data} config={config} />
    </div>
  );
};
```

## Dashboard Management UI

### Creating a New Dashboard

```typescript
const DashboardCreator = () => {
  const [name, setName] = useState('');
  const [selectedWidgets, setSelectedWidgets] = useState([]);

  const handleCreate = async () => {
    const dashboard = await api.post('/api/dashboards', {
      name,
      description: 'My custom dashboard',
      widgets: selectedWidgets.map((widget, index) => ({
        widget_definition_id: widget.id,
        layout_config: {
          x: (index % 3) * 4,
          y: Math.floor(index / 3) * 3,
          w: 4,
          h: 3
        }
      }))
    });

    // Navigate to the new dashboard
    navigate(`/dashboard/${dashboard.data.data.id}`);
  };

  return (
    <div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Dashboard Name"
      />
      <WidgetSelector
        onSelect={setSelectedWidgets}
        selected={selectedWidgets}
      />
      <button onClick={handleCreate}>Create Dashboard</button>
    </div>
  );
};
```

### Widget Selector Component

```typescript
const WidgetSelector = ({ onSelect, selected }) => {
  const [widgetDefinitions, setWidgetDefinitions] = useState([]);

  useEffect(() => {
    api.get('/api/widget-definitions').then(response => {
      setWidgetDefinitions(response.data.data);
    });
  }, []);

  return (
    <div className="widget-selector">
      {widgetDefinitions.map(widget => (
        <div
          key={widget.id}
          className={`widget-card ${selected.includes(widget) ? 'selected' : ''}`}
          onClick={() => {
            if (selected.includes(widget)) {
              onSelect(selected.filter(w => w.id !== widget.id));
            } else {
              onSelect([...selected, widget]);
            }
          }}
        >
          <h4>{widget.name}</h4>
          <p>{widget.description}</p>
          <span className="widget-type">{widget.widget_type_name}</span>
        </div>
      ))}
    </div>
  );
};
```

## Best Practices

1. **Caching**: Cache widget types and definitions as they rarely change
2. **Debouncing**: Debounce layout update API calls during drag operations
3. **Error Handling**: Show fallback UI when widget data fails to load
4. **Loading States**: Display skeleton loaders while fetching dashboard data
5. **Permissions**: Disable drag/edit based on user permissions
6. **Optimization**: Use React.memo for widget components to prevent unnecessary re-renders

## Testing

```typescript
// Test loading a dashboard
const testDashboard = async () => {
  const dashboard = await api.get('/api/dashboards/your-dashboard-id');
  console.log('Dashboard:', dashboard.data);
};

// Test updating layouts
const testLayoutUpdate = async () => {
  const result = await updateLayouts('dashboard-id', [
    { i: 'layout-id', x: 0, y: 0, w: 6, h: 3 }
  ]);
  console.log('Updated:', result);
};
```

## Example Data Flow

1. User logs in → JWT token stored
2. Fetch user's dashboards → Display dashboard list
3. User selects dashboard → Load dashboard with layouts
4. Convert layouts to react-grid-layout format
5. Fetch data for each widget based on data_source_config
6. Render widgets in grid
7. User drags widget → Update local state
8. On drag stop → Call bulk update API
9. Backend saves new positions → Dashboard version increments

## Integration with Existing Components

You already have these components that can be converted to widgets:
- FlowRateCharts → FlowRateChartWidget
- FractionsChart → PieChartWidget / DonutChartWidget
- AlarmsTable → AlarmsTableWidget
- MetricsCards → KPIWidget
- ProductionMap → MapWidget
- TopRegionsChart → BarChartWidget

Simply wrap them with the widget interface and data fetching logic!
