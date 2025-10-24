import React from 'react';
import { DashboardLayout } from '../../services/api';
import StatsCard from '../Charts/StatsCard';
import Timer from '../Charts/Timer';
import OfrChart from '../Charts/OfrChart';
import WfrChart from '../Charts/WfrChart';
import GfrChart from '../Charts/GfrChart';
import FractionsChart from './FractionsChart';
import GVFWLRCharts from './GVFWLRCharts';
import ProductionMap from './ProductionMap';
import { useTheme } from '../../hooks/useTheme';

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
  const { theme } = useTheme();
  const { widget_type_name, component_name, data_source_config, widget_name } = widget;

  // Helper to get latest value from chart data
  const getLatestValue = (metric: string) => {
    if (hierarchyChartData?.latestData) {
      return hierarchyChartData.latestData[metric] || 0;
    }
    if (chartData?.latestData) {
      return chartData.latestData[metric] || 0;
    }
    return 0;
  };

  // KPI Widgets (Metric Cards)
  if (widget_type_name === 'kpi' && component_name === 'KPIWidget') {
    const metric = data_source_config?.metric;
    const label = data_source_config?.label || widget_name;
    const unit = data_source_config?.unit || '';

    if (metric === 'last_refresh') {
      return <Timer lastRefresh={lastRefresh} />;
    }

    if (metric === 'total_ofr') {
      const value = getLatestValue('ofr');
      return <StatsCard title={label} value={value} unit={unit} />;
    }

    if (metric === 'total_wfr') {
      const value = getLatestValue('wfr');
      return <StatsCard title={label} value={value} unit={unit} />;
    }

    if (metric === 'total_gfr') {
      const value = getLatestValue('gfr');
      return <StatsCard title={label} value={value} unit={unit} />;
    }

    return null;
  }

  // Line Chart Widgets
  if (widget_type_name === 'line_chart' && component_name === 'LineChartWidget') {
    const metric = data_source_config?.metric;
    const title = data_source_config?.title || widget_name;

    if (metric === 'ofr') {
      return (
        <OfrChart
          chartData={chartData}
          hierarchyChartData={hierarchyChartData}
          timeRange={timeRange as '1day' | '7days' | '1month'}
          isDeviceOffline={isDeviceOffline}
        />
      );
    }

    if (metric === 'wfr') {
      return (
        <WfrChart
          chartData={chartData}
          hierarchyChartData={hierarchyChartData}
          timeRange={timeRange as '1day' | '7days' | '1month'}
          isDeviceOffline={isDeviceOffline}
        />
      );
    }

    if (metric === 'gfr') {
      return (
        <GfrChart
          chartData={chartData}
          hierarchyChartData={hierarchyChartData}
          timeRange={timeRange as '1day' | '7days' | '1month'}
          isDeviceOffline={isDeviceOffline}
        />
      );
    }

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

  // Donut Chart Widgets (GVF & WLR Gauges)
  if (widget_type_name === 'donut_chart' && component_name === 'DonutChartWidget') {
    return (
      <div className={`rounded-lg p-2 h-full ${
        theme === 'dark' ? 'bg-[#162345]' : 'bg-white border border-gray-200'
      }`}>
        <GVFWLRCharts
          chartData={chartData}
          hierarchyChartData={hierarchyChartData}
          isDeviceOffline={isDeviceOffline}
        />
      </div>
    );
  }

  // Map Widget
  if (widget_type_name === 'map' && component_name === 'MapWidget') {
    return (
      <ProductionMap
        selectedHierarchy={selectedHierarchy}
        selectedDevice={selectedDevice}
      />
    );
  }

  return (
    <div className={`p-4 rounded-lg ${
      theme === 'dark' ? 'bg-[#162345]' : 'bg-white border border-gray-200'
    }`}>
      <p className="text-sm text-gray-500">
        Widget: {widget_name} ({widget_type_name})
      </p>
    </div>
  );
};

export default WidgetRenderer;
