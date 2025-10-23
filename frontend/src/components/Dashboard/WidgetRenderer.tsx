import React from 'react';
import { DashboardLayout } from '../../services/api';
import MetricsCards from './MetricsCards';
import FlowRateCharts from './FlowRateCharts';
import FractionsChart from './FractionsChart';
import GVFWLRCharts from './GVFWLRCharts';
import TopRegionsChart from './TopRegionsChart';
import ProductionMap from './ProductionMap';

interface WidgetRendererProps {
  widget: DashboardLayout;
  chartData: any;
  hierarchyChartData: any;
  selectedDevice: any;
  selectedHierarchy: any;
  timeRange: string;
  lastRefresh: Date;
  isDeviceOffline: boolean;
}

const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widget,
  chartData,
  hierarchyChartData,
  selectedDevice,
  selectedHierarchy,
  timeRange,
  lastRefresh,
  isDeviceOffline,
}) => {
  const { widget_type_name, component_name, data_source_config } = widget;

  if (widget_type_name === 'kpi' && component_name === 'KPIWidget') {
    const metric = data_source_config?.metric;

    if (metric === 'last_refresh') {
      return null;
    }
    return null;
  }

  if (widget_type_name === 'line_chart' && component_name === 'LineChartWidget') {
    const metric = data_source_config?.metric;

    if (metric === 'fractions') {
      return (
        <FractionsChart
          chartData={chartData}
          hierarchyChartData={hierarchyChartData}
          isDeviceOffline={isDeviceOffline}
        />
      );
    }

    return null;
  }

  if (widget_type_name === 'pie_chart' && component_name === 'PieChartWidget') {
    return (
      <TopRegionsChart
        selectedHierarchy={selectedHierarchy}
        selectedDevice={selectedDevice}
      />
    );
  }

  if (widget_type_name === 'map' && component_name === 'MapWidget') {
    return (
      <ProductionMap
        selectedHierarchy={selectedHierarchy}
        selectedDevice={selectedDevice}
      />
    );
  }

  return null;
};

export default WidgetRenderer;
