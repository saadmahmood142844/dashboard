const database = require('../config/database');

async function seedDefaultDashboard() {
  try {
    console.log('Seeding default dashboard configuration...');

    // First, check if widget types and definitions exist
    const widgetTypesResult = await database.query('SELECT COUNT(*) FROM widget_types');
    if (parseInt(widgetTypesResult.rows[0].count) === 0) {
      console.log('⚠️  No widget types found. Please run seedWidgets.js first.');
      return;
    }

    // Get the admin user (first user)
    const userResult = await database.query('SELECT id FROM "user" ORDER BY id ASC LIMIT 1');
    if (userResult.rows.length === 0) {
      console.log('⚠️  No users found. Please create a user first.');
      return;
    }
    const userId = userResult.rows[0].id;

    // Check if default dashboard already exists
    const existingDashboard = await database.query(
      'SELECT id FROM dashboards WHERE name = $1 AND created_by = $2',
      ['Default Production Dashboard', userId]
    );

    let dashboardId;
    if (existingDashboard.rows.length > 0) {
      dashboardId = existingDashboard.rows[0].id;
      console.log('○ Default dashboard already exists, ID:', dashboardId);

      // Delete existing layouts for this dashboard
      await database.query('DELETE FROM dashboard_layouts WHERE dashboard_id = $1', [dashboardId]);
      console.log('✓ Cleared existing layouts');
    } else {
      // Create default dashboard
      const dashboardResult = await database.query(
        `INSERT INTO dashboards (name, description, created_by, grid_config)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [
          'Default Production Dashboard',
          'Main production monitoring dashboard with KPIs, charts, and map',
          userId,
          JSON.stringify({
            cols: 12,
            rowHeight: 100,
            margin: [10, 10],
            breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
            containerPadding: [10, 10]
          })
        ]
      );
      dashboardId = dashboardResult.rows[0].id;
      console.log('✓ Created default dashboard, ID:', dashboardId);
    }

    // Get widget types
    const widgetTypes = await database.query('SELECT id, name FROM widget_types');
    const widgetTypeMap = {};
    widgetTypes.rows.forEach(row => {
      widgetTypeMap[row.name] = row.id;
    });

    // Define widget definitions matching the ACTUAL current dashboard structure
    // Based on DashboardContent.tsx components:
    // 1. MetricsCards (4 KPI cards in a row)
    // 2. FlowRateCharts (3 line charts: OFR, WFR, GFR)
    // 3. FractionsChart (1 line chart)
    // 4. GVFWLRCharts (2 donut charts side-by-side)
    // 5. ProductionMap (1 map)

    const widgetDefinitions = [
      // Row 1: Metrics Cards (4 KPIs)
      {
        name: 'Oil Flow Rate Card',
        description: 'Total Oil Flow Rate metric card with live updates',
        widget_type: 'kpi',
        data_source_config: {
          metric: 'total_ofr',
          unit: 'l/min',
          label: 'Total OFR',
          component: 'MetricsCards',
          cardIndex: 0
        },
        layout_config: { x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2, static: false },
        display_order: 1
      },
      {
        name: 'Water Flow Rate Card',
        description: 'Total Water Flow Rate metric card with live updates',
        widget_type: 'kpi',
        data_source_config: {
          metric: 'total_wfr',
          unit: 'l/min',
          label: 'Total WFR',
          component: 'MetricsCards',
          cardIndex: 1
        },
        layout_config: { x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2, static: false },
        display_order: 2
      },
      {
        name: 'Gas Flow Rate Card',
        description: 'Total Gas Flow Rate metric card with live updates',
        widget_type: 'kpi',
        data_source_config: {
          metric: 'total_gfr',
          unit: 'l/min',
          label: 'Total GFR',
          component: 'MetricsCards',
          cardIndex: 2
        },
        layout_config: { x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2, static: false },
        display_order: 3
      },
      {
        name: 'Last Refresh Time',
        description: 'Last data refresh timestamp display',
        widget_type: 'kpi',
        data_source_config: {
          metric: 'last_refresh',
          label: 'Last Refresh',
          component: 'MetricsCards',
          cardIndex: 3
        },
        layout_config: { x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2, static: false },
        display_order: 4
      },

      // Row 2: Flow Rate Line Charts (OFR, WFR)
      {
        name: 'OFR Trend Chart',
        description: 'Oil Flow Rate time-series trend chart',
        widget_type: 'line_chart',
        data_source_config: {
          metric: 'ofr',
          timeRange: 'dynamic',
          yAxisLabel: 'OFR (l/min)',
          title: 'Oil Flow Rate',
          unit: 'l/min',
          dataKey: 'ofr',
          component: 'FlowRateCharts'
        },
        layout_config: { x: 0, y: 2, w: 6, h: 4, minW: 4, minH: 3, static: false },
        display_order: 5
      },
      {
        name: 'WFR Trend Chart',
        description: 'Water Flow Rate time-series trend chart',
        widget_type: 'line_chart',
        data_source_config: {
          metric: 'wfr',
          timeRange: 'dynamic',
          yAxisLabel: 'WFR (l/min)',
          title: 'Water Flow Rate',
          unit: 'l/min',
          dataKey: 'wfr',
          component: 'FlowRateCharts'
        },
        layout_config: { x: 6, y: 2, w: 6, h: 4, minW: 4, minH: 3, static: false },
        display_order: 6
      },

      // Row 3: GFR Chart
      {
        name: 'GFR Trend Chart',
        description: 'Gas Flow Rate time-series trend chart',
        widget_type: 'line_chart',
        data_source_config: {
          metric: 'gfr',
          timeRange: 'dynamic',
          yAxisLabel: 'GFR (l/min)',
          title: 'Gas Flow Rate',
          unit: 'l/min',
          dataKey: 'gfr',
          component: 'FlowRateCharts'
        },
        layout_config: { x: 0, y: 6, w: 12, h: 4, minW: 4, minH: 3, static: false },
        display_order: 7
      },

      // Row 4: Fractions Chart and GVF/WLR Charts
      {
        name: 'Production Fractions',
        description: 'Oil, Water, and Gas production fractions over time',
        widget_type: 'line_chart',
        data_source_config: {
          metric: 'fractions',
          metrics: ['gor', 'wlr'],
          yAxisLabel: 'Ratio',
          title: 'Production Fractions',
          component: 'FractionsChart'
        },
        layout_config: { x: 0, y: 10, w: 6, h: 4, minW: 4, minH: 3, static: false },
        display_order: 8
      },
      {
        name: 'GVF and WLR Gauges',
        description: 'Gas Volume Fraction and Water Liquid Ratio percentage gauges',
        widget_type: 'donut_chart',
        data_source_config: {
          metrics: ['gvf', 'wlr'],
          title: 'GVF & WLR',
          component: 'GVFWLRCharts'
        },
        layout_config: { x: 6, y: 10, w: 6, h: 4, minW: 4, minH: 3, static: false },
        display_order: 9
      },

      // Row 5: Production Map
      {
        name: 'Production Map View',
        description: 'Geographic map showing all production sites and devices',
        widget_type: 'map',
        data_source_config: {
          showDevices: true,
          showHierarchy: true,
          clusterMarkers: true,
          component: 'ProductionMap'
        },
        layout_config: { x: 0, y: 14, w: 12, h: 6, minW: 6, minH: 4, static: false },
        display_order: 10
      }
    ];

    // Create widget definitions and layouts
    let createdCount = 0;
    for (const widgetDef of widgetDefinitions) {
      const widgetTypeId = widgetTypeMap[widgetDef.widget_type];
      if (!widgetTypeId) {
        console.log(`⚠️  Widget type '${widgetDef.widget_type}' not found, skipping '${widgetDef.name}'`);
        continue;
      }

      // Create widget definition
      const widgetDefResult = await database.query(
        `INSERT INTO widget_definitions
         (name, description, widget_type_id, data_source_config, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          widgetDef.name,
          widgetDef.description,
          widgetTypeId,
          JSON.stringify(widgetDef.data_source_config),
          userId
        ]
      );
      const widgetDefinitionId = widgetDefResult.rows[0].id;

      // Create dashboard layout
      await database.query(
        `INSERT INTO dashboard_layouts
         (dashboard_id, widget_definition_id, layout_config, display_order)
         VALUES ($1, $2, $3, $4)`,
        [
          dashboardId,
          widgetDefinitionId,
          JSON.stringify(widgetDef.layout_config),
          widgetDef.display_order
        ]
      );

      createdCount++;
      console.log(`✓ Created widget: ${widgetDef.name}`);
    }

    console.log(`\n✓ Default dashboard seeded successfully!`);
    console.log(`  - Dashboard ID: ${dashboardId}`);
    console.log(`  - Widgets created: ${createdCount}`);
    console.log(`  - Owner: User ${userId}`);

  } catch (error) {
    console.error('Error seeding default dashboard:', error);
    throw error;
  }
}

if (require.main === module) {
  database.connect().then(async () => {
    try {
      await seedDefaultDashboard();
      process.exit(0);
    } catch (error) {
      console.error('Seeding failed:', error);
      process.exit(1);
    }
  });
}

module.exports = seedDefaultDashboard;
