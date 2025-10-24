// DashboardContent.tsx
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { shouldSkipUpdate } from '../../utils/chartUtils';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { apiService, DeviceChartData, HierarchyChartData, Device, DashboardLayout } from '../../services/api';
import WidgetRenderer from './WidgetRenderer';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardContentProps {
  children?: React.ReactNode;
  selectedDevice?: Device | null;
  selectedHierarchy?: any | null;
}

// Animated dropdown component using Framer Motion
const AnimatedSelect: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  theme: 'dark' | 'light' | string;
}> = ({ value, onChange, options, theme }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const selectedIndex = options.findIndex((o) => o.value === value);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (!listRef.current) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.min(options.length - 1, selectedIndex + 1);
        onChange(options[next].value);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = Math.max(0, selectedIndex - 1);
        onChange(options[prev].value);
      } else if (e.key === 'Escape') {
        setOpen(false);
      } else if (e.key === 'Enter') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, selectedIndex, options, onChange]);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-opacity-30 text-sm font-medium ${
          theme === 'dark'
            ? 'bg-[#162345] text-white shadow-md hover:shadow-lg focus:ring-[#7c9cff]'
            : 'bg-white text-gray-900 border border-gray-200 shadow-sm hover:shadow-md focus:ring-[#6366F1]'
        }`}
      >
        <span className="flex items-center gap-2">
          <Calendar className="w-4 h-4 opacity-80" />
          <span>{options.find((o) => o.value === value)?.label}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 600, damping: 30 }}
            ref={listRef}
            role="listbox"
            aria-activedescendant={options[selectedIndex]?.value}
            className={`absolute right-0 mt-2 w-56 rounded-lg z-50 overflow-hidden shadow-xl ring-1 ring-black ring-opacity-5 ${
              theme === 'dark'
                ? 'bg-[#0b1326] text-white'
                : 'bg-white text-gray-900'
            }`}
          >
            <div className="max-h-56 overflow-auto">
              {options.map((opt, idx) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onChange(opt.value);
                        setOpen(false);
                      }
                    }}
                    tabIndex={0}
                    className={`flex items-center justify-between gap-2 px-4 py-2 cursor-pointer select-none hover:bg-opacity-10 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors ${
                      theme === 'dark'
                        ? 'hover:bg-white/6 focus:bg-white/6'
                        : 'hover:bg-gray-50 focus:bg-gray-50'
                    } ${isSelected ? 'font-semibold' : 'font-normal'}`}
                  >
                    <div className="truncate">{opt.label}</div>
                    <div className="flex items-center gap-2">
                      {isSelected && <Check className="w-4 h-4 opacity-90" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DashboardContent: React.FC<DashboardContentProps> = ({
  children,
  selectedDevice,
  selectedHierarchy,
}) => {
  const { token } = useAuth();
  const { theme } = useTheme();
  // Separate states for metrics and flow rate charts
  const [metricsChartData, setMetricsChartData] =
    useState<DeviceChartData | null>(null);
  const [metricsHierarchyChartData, setMetricsHierarchyChartData] =
    useState<HierarchyChartData | null>(null);
  const [flowRateChartData, setFlowRateChartData] =
    useState<DeviceChartData | null>(null);
  const [flowRateHierarchyChartData, setFlowRateHierarchyChartData] =
    useState<HierarchyChartData | null>(null);

  // default matches AnimatedSelect option values
  const [timeRange, setTimeRange] = useState<string>('1day');
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardLayout[]>([]);
  const [widgetsLoading, setWidgetsLoading] = useState(false);

  // Time range options
  const timeRangeOptions = [
    { value: '1day', label: 'Today', apiValue: 'day' },
    { value: '7days', label: 'Last 7 Days', apiValue: 'week' },
    { value: '1month', label: 'Last 1 Month', apiValue: 'month' },
  ];

  const handleTimeRangeChange = (newTimeRange: string) => {
    setTimeRange(newTimeRange);
  };

  const getCurrentTimeRangeApiValue = () => {
    const option = timeRangeOptions.find((opt) => opt.value === timeRange);
    return option?.apiValue || 'day';
  };

  useEffect(() => {
    const loadDashboardWidgets = async () => {
      if (!token) return;

      console.log('🔄 Loading dashboard widgets from database...');
      setWidgetsLoading(true);
      try {
        const dashboards = await apiService.getUserDashboards(token);
        console.log('📊 Dashboards received:', dashboards.data);

        if (dashboards.success && dashboards.data && dashboards.data.length > 0) {
          // Try to find 'Production Dashboard' or 'Production Overview', fallback to first active dashboard
          const defaultDashboard =
            dashboards.data.find(d => d.name === 'Production Dashboard') ||
            dashboards.data.find(d => d.name === 'Production Overview') ||
            dashboards.data.find(d => d.is_active) ||
            dashboards.data[0];

          console.log('✅ Selected dashboard:', defaultDashboard.name, '(ID:', defaultDashboard.id + ')');

          const layouts = await apiService.getDashboardLayouts(defaultDashboard.id, token);
          console.log('📦 Widget layouts loaded:', layouts.data?.length || 0);

          if (layouts.success && layouts.data && layouts.data.length > 0) {
            console.log('🎨 Widget configurations from database:');
            layouts.data.forEach((widget, index) => {
              console.log(`  ${index + 1}. ${widget.widget_name} (${widget.widget_type_name})`);
              console.log(`     Position: x=${widget.layout_config.x}, y=${widget.layout_config.y}, w=${widget.layout_config.w}, h=${widget.layout_config.h}`);
              console.log(`     Config:`, widget.data_source_config);
            });
            setDashboardWidgets(layouts.data);
          } else {
            console.warn('⚠️ No widgets found for this dashboard. Dashboard might be empty.');
          }
        } else {
          console.warn('⚠️ No dashboards found for this user.');
        }
      } catch (error) {
        console.error('❌ Failed to load dashboard widgets:', error);
      } finally {
        setWidgetsLoading(false);
      }
    };

    loadDashboardWidgets();
  }, [token]);

  // Load metrics data (only when device/hierarchy changes, not when time range changes)
  useEffect(() => {
    if (selectedDevice && !selectedHierarchy) {
      loadDeviceMetricsData(selectedDevice.deviceId || selectedDevice.id);
      setMetricsHierarchyChartData(null);
    } else if (selectedHierarchy && !selectedDevice) {
      loadHierarchyMetricsData(selectedHierarchy.id);
      setMetricsChartData(null);
    }
    // only when selected device or hierarchy changes (or token)
  }, [selectedDevice, selectedHierarchy, token]);

  // Load flow rate chart data (updates when device/hierarchy OR time range changes)
  useEffect(() => {
    if (selectedDevice && !selectedHierarchy) {
      loadDeviceFlowRateData(selectedDevice.deviceId || selectedDevice.id);
      setFlowRateHierarchyChartData(null);
    } else if (selectedHierarchy && !selectedDevice) {
      loadHierarchyFlowRateData(selectedHierarchy.id);
      setFlowRateChartData(null);
    }
  }, [selectedDevice, selectedHierarchy, timeRange, token]); // timeRange dependency here

  // Auto-refresh every 5 seconds - refresh both metrics and flow rate data
  useEffect(() => {
    const startAutoRefresh = () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      refreshIntervalRef.current = setInterval(() => {
        setLastRefresh(new Date());

        if (selectedDevice && !selectedHierarchy) {
          // Refresh metrics with default time range
          loadDeviceMetricsData(selectedDevice.deviceId || selectedDevice.id);
          // Refresh flow rate with current time range
          loadDeviceFlowRateData(selectedDevice.deviceId || selectedDevice.id);
        } else if (selectedHierarchy && !selectedDevice) {
          // Refresh metrics with default time range
          loadHierarchyMetricsData(selectedHierarchy.id);
          // Refresh flow rate with current time range
          loadHierarchyFlowRateData(selectedHierarchy.id);
        }
      }, 5000);
    };

    startAutoRefresh();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [selectedDevice, selectedHierarchy, token, timeRange]);

  const transformDeviceData = (
    response: any,
    deviceId: number | string
  ): DeviceChartData => {
    return {
      device: {
        id: response.data.device.deviceId?.toString() || deviceId.toString(),
        serial_number: response.data.device.deviceSerial,
        type: response.data.device.deviceName,
        logo: response.data.device.deviceLogo,
        metadata: response.data.device.metadata,
        created_at: response.data.device.createdAt || new Date().toISOString(),
        location: response.data.device.wellName,
        company: response.data.device.companyName || 'Unknown',
        status: response.data.device.status,
      },
      chartData: response.data.chartData.map((point: any) => ({
        timestamp: point.timestamp,
        gfr: point.gfr,
        gor: point.gor,
        gvf: point.gvf,
        ofr: point.ofr,
        wfr: point.wfr,
        wlr: point.wlr,
        pressure: point.pressure,
        temperature: point.temperature,
      })),
      latestData: response.data.latestData,
      timeRange: response.data.timeRange,
      totalDataPoints: response.data.totalDataPoints,
    };
  };

  const loadDeviceMetricsData = async (deviceId: number | string) => {
    if (!token) return;

    setIsLoading(true);
    try {
      const deviceIdNumber =
        typeof deviceId === 'string' ? parseInt(deviceId) : deviceId;
      // Always use 'day' for metrics to keep them consistent
      const response = await apiService.getDeviceChartDataEnhanced(
        deviceIdNumber,
        'day',
        token
      );
      if (response.success && response.data) {
        setMetricsChartData(transformDeviceData(response, deviceId));
      }
    } catch (error) {
      console.error('Failed to load device metrics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDeviceFlowRateData = async (deviceId: number | string) => {
    if (!token) return;

    try {
      const deviceIdNumber =
        typeof deviceId === 'string' ? parseInt(deviceId) : deviceId;
      const response = await apiService.getDeviceChartDataEnhanced(
        deviceIdNumber,
        getCurrentTimeRangeApiValue(),
        token
      );
      if (response.success && response.data) {
        const newData = transformDeviceData(response, deviceId);
        if (!shouldSkipUpdate(flowRateChartData?.chartData, newData.chartData)) {
          setFlowRateChartData(newData);
        }
      }
    } catch (error) {
      console.error('Failed to load device flow rate data:', error);
    }
  };

  const loadHierarchyMetricsData = async (hierarchyId: number | string) => {
    if (!token) return;

    setIsLoading(true);
    try {
      // Always use 'day' for metrics to keep them consistent
      const response = await apiService.getHierarchyChartDataEnhanced(
        Number(hierarchyId),
        'day',
        token
      );
      if (response.success && response.data) {
        setMetricsHierarchyChartData(response.data);
      }
    } catch (error) {
      console.error('Failed to load hierarchy metrics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHierarchyFlowRateData = async (hierarchyId: number | string) => {
    if (!token) return;

    try {
      const response = await apiService.getHierarchyChartDataEnhanced(
        Number(hierarchyId),
        getCurrentTimeRangeApiValue(),
        token
      );
      if (response.success && response.data) {
        const newData = response.data;
        if (!shouldSkipUpdate(flowRateHierarchyChartData?.chartData, newData.chartData)) {
          setFlowRateHierarchyChartData(newData);
        }
      }
    } catch (error) {
      console.error('Failed to load hierarchy flow rate data:', error);
    }
  };

  return (
    <div
      className={`h-full p-4 overflow-y-auto ${
        theme === 'dark' ? 'bg-[]' : 'bg-gray-50'
      }`}
    >
      {children || (
        <>
          {/* Time Range Selector */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1
                className={`text-3xl font-semibold md:tracking-wide ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}
              >
                {selectedHierarchy &&
                selectedHierarchy.id !== selectedHierarchy.name
                  ? `${selectedHierarchy.name} Dashboard`
                  : selectedDevice
                  ? `Device ${
                      selectedDevice.serial_number ||
                      selectedDevice.deviceSerial
                    } Dashboard`
                  : 'Production Dashboard'}
              </h1>
              {(isLoading || widgetsLoading) && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span
                    className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {widgetsLoading ? 'Loading dashboard...' : 'Loading...'}
                  </span>
                </div>
              )}
              {dashboardWidgets.length > 0 && !widgetsLoading && (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    theme === 'dark'
                      ? 'bg-green-900/30 text-green-400'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {dashboardWidgets.length} widgets loaded
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <AnimatedSelect
                value={timeRange}
                onChange={handleTimeRangeChange}
                options={timeRangeOptions.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                theme={theme}
              />
            </div>
          </div>

          {/* Dynamic Widget Grid - Desktop */}
          {dashboardWidgets.length > 0 ? (
            <>
              <div
                className="hidden md:grid gap-4"
                style={{
                  gridTemplateColumns: 'repeat(12, 1fr)',
                  gridAutoRows: '100px',
                }}
              >
                {dashboardWidgets.map((widget) => (
                  <div
                    key={widget.id}
                    style={{
                      gridColumn: `span ${widget.layout_config.w}`,
                      gridRow: `span ${widget.layout_config.h}`,
                    }}
                    className="min-h-0 min-w-0"
                  >
                    <WidgetRenderer
                      widget={widget}
                      chartData={flowRateChartData}
                      hierarchyChartData={flowRateHierarchyChartData}
                      selectedDevice={selectedDevice}
                      selectedHierarchy={selectedHierarchy}
                      timeRange={timeRange}
                      lastRefresh={lastRefresh}
                      isDeviceOffline={metricsChartData?.device?.status === 'Offline'}
                    />
                  </div>
                ))}
              </div>

              {/* Dynamic Widget Grid - Mobile (Single Column) */}
              <div className="md:hidden grid grid-cols-1 gap-4">
                {dashboardWidgets.map((widget) => (
                  <div
                    key={widget.id}
                    style={{
                      minHeight: `${widget.layout_config.h * 100}px`,
                    }}
                  >
                    <WidgetRenderer
                      widget={widget}
                      chartData={flowRateChartData}
                      hierarchyChartData={flowRateHierarchyChartData}
                      selectedDevice={selectedDevice}
                      selectedHierarchy={selectedHierarchy}
                      timeRange={timeRange}
                      lastRefresh={lastRefresh}
                      isDeviceOffline={metricsChartData?.device?.status === 'Offline'}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : !widgetsLoading ? (
            <div className={`text-center py-8 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <p>No widgets configured for this dashboard.</p>
              <p className="text-sm mt-2">Run the seeding script to populate widgets.</p>
            </div>
          ) : null}

          {/* Version Info */}
          <div className={`text-center py-4 mt-8 text-xs ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Version 1.0.0 - Dynamic Widget System
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardContent;
