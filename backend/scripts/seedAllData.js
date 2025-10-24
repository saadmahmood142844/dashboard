const database = require('../config/database');

async function seedAllData() {
  try {
    console.log('\n=== Starting Complete Database Seeding ===\n');

    // Step 1: Seed Widget Types
    console.log('Step 1: Seeding Widget Types...');
    const widgetTypes = [
      {
        name: 'kpi',
        component_name: 'KPIWidget',
        default_config: {
          format: 'number',
          unit: '',
          showTrend: true,
          trendPeriod: '24h',
          size: 'medium'
        }
      },
      {
        name: 'line_chart',
        component_name: 'LineChartWidget',
        default_config: {
          timeRange: '24h',
          yAxisLabel: '',
          xAxisLabel: 'Time',
          showGrid: true,
          showLegend: true,
          curveType: 'smooth',
          colors: ['#3b82f6', '#8b5cf6', '#ec4899']
        }
      },
      {
        name: 'donut_chart',
        component_name: 'DonutChartWidget',
        default_config: {
          showLegend: true,
          showLabels: true,
          innerRadius: 0.6,
          colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']
        }
      },
      {
        name: 'map',
        component_name: 'MapWidget',
        default_config: {
          center: [0, 0],
          zoom: 5,
          markerType: 'default',
          clusterMarkers: true,
          showPopup: true
        }
      }
    ];

    for (const widgetType of widgetTypes) {
      const checkQuery = 'SELECT id FROM widget_types WHERE name = $1';
      const existingResult = await database.query(checkQuery, [widgetType.name]);

      if (existingResult.rows.length === 0) {
        const insertQuery = `
          INSERT INTO widget_types (name, component_name, default_config)
          VALUES ($1, $2, $3)
          RETURNING *
        `;

        await database.query(insertQuery, [
          widgetType.name,
          widgetType.component_name,
          JSON.stringify(widgetType.default_config)
        ]);

        console.log(`  ✓ Created widget type: ${widgetType.name}`);
      } else {
        console.log(`  ○ Widget type already exists: ${widgetType.name}`);
      }
    }

    // Step 2: Get or Create User
    console.log('\nStep 2: Checking for user...');
    const userResult = await database.query('SELECT id FROM "user" ORDER BY id ASC LIMIT 1');
    if (userResult.rows.length === 0) {
      console.log('  ⚠️  No users found. Please create a user first using the signup endpoint.');
      return;
    }
    const userId = userResult.rows[0].id;
    console.log(`  ✓ Using user ID: ${userId}`);

    // Step 3: Create or Find Dashboard
    console.log('\nStep 3: Setting up dashboard...');
    const existingDashboard = await database.query(
      'SELECT id FROM dashboards WHERE name = $1 AND created_by = $2',
      ['Production Dashboard', userId]
    );

    let dashboardId;
    if (existingDashboard.rows.length > 0) {
      dashboardId = existingDashboard.rows[0].id;
      console.log(`  ○ Dashboard already exists, ID: ${dashboardId}`);

      // Clear existing layouts
      await database.query('DELETE FROM dashboard_layouts WHERE dashboard_id = $1', [dashboardId]);
      console.log('  ✓ Cleared existing widget layouts');
    } else {
      const dashboardResult = await database.query(
        `INSERT INTO dashboards (name, description, created_by, grid_config)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [
          'Production Dashboard',
          'Complete production monitoring',
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
      console.log(`  ✓ Created dashboard, ID: ${dashboardId}`);
    }

    // Step 4: Get Widget Types Map
    console.log('\nStep 4: Loading widget types...');
    const widgetTypesResult = await database.query('SELECT id, name FROM widget_types');
    const widgetTypeMap = {};
    widgetTypesResult.rows.forEach(row => {
      widgetTypeMap[row.name] = row.id;
    });
    console.log(`  ✓ Loaded ${widgetTypesResult.rows.length} widget types`);

    // Step 5: Create Widget Definitions and Layouts
    console.log('\nStep 5: Creating widgets...');

    const widgetDefinitions = [
      {
        name: 'Oil Flow Rate Card',
        description: 'Total Oil Flow Rate metric card',
        widget_type: 'kpi',
        data_source_config: { metric: 'total_ofr', unit: 'l/min', label: 'Total OFR' },
        layout_config: { x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
        display_order: 1
      },
      {
        name: 'Water Flow Rate Card',
        description: 'Total Water Flow Rate metric card',
        widget_type: 'kpi',
        data_source_config: { metric: 'total_wfr', unit: 'l/min', label: 'Total WFR' },
        layout_config: { x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
        display_order: 2
      },
      {
        name: 'Gas Flow Rate Card',
        description: 'Total Gas Flow Rate metric card',
        widget_type: 'kpi',
        data_source_config: { metric: 'total_gfr', unit: 'l/min', label: 'Total GFR' },
        layout_config: { x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
        display_order: 3
      },
      {
        name: 'Last Refresh Time',
        description: 'Last data refresh timestamp',
        widget_type: 'kpi',
        data_source_config: { metric: 'last_refresh', label: 'Last Refresh' },
        layout_config: { x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
        display_order: 4
      },
      {
        name: 'OFR Trend Chart',
        description: 'Oil Flow Rate trend',
        widget_type: 'line_chart',
        data_source_config: { metric: 'ofr', timeRange: 'dynamic', yAxisLabel: 'OFR (l/min)', title: 'Oil Flow Rate', unit: 'l/min' },
        layout_config: { x: 0, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
        display_order: 5
      },
      {
        name: 'WFR Trend Chart',
        description: 'Water Flow Rate trend',
        widget_type: 'line_chart',
        data_source_config: { metric: 'wfr', timeRange: 'dynamic', yAxisLabel: 'WFR (l/min)', title: 'Water Flow Rate', unit: 'l/min' },
        layout_config: { x: 6, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
        display_order: 6
      },
      {
        name: 'GFR Trend Chart',
        description: 'Gas Flow Rate trend',
        widget_type: 'line_chart',
        data_source_config: { metric: 'gfr', timeRange: 'dynamic', yAxisLabel: 'GFR (l/min)', title: 'Gas Flow Rate', unit: 'l/min' },
        layout_config: { x: 0, y: 6, w: 12, h: 4, minW: 4, minH: 3 },
        display_order: 7
      },
      {
        name: 'Production Fractions',
        description: 'Production fractions over time',
        widget_type: 'line_chart',
        data_source_config: { metric: 'fractions', metrics: ['gor', 'wlr'], yAxisLabel: 'Ratio', title: 'Production Fractions' },
        layout_config: { x: 0, y: 10, w: 6, h: 4, minW: 4, minH: 3 },
        display_order: 8
      },
      {
        name: 'GVF and WLR Gauges',
        description: 'GVF and WLR percentage gauges',
        widget_type: 'donut_chart',
        data_source_config: { metrics: ['gvf', 'wlr'], title: 'GVF & WLR' },
        layout_config: { x: 6, y: 10, w: 6, h: 4, minW: 4, minH: 3 },
        display_order: 9
      },
      {
        name: 'Production Map View',
        description: 'Geographic production map',
        widget_type: 'map',
        data_source_config: { showDevices: true, showHierarchy: true, clusterMarkers: true },
        layout_config: { x: 0, y: 14, w: 12, h: 6, minW: 6, minH: 4 },
        display_order: 10
      }
    ];

    let createdCount = 0;
    for (const widgetDef of widgetDefinitions) {
      const widgetTypeId = widgetTypeMap[widgetDef.widget_type];
      if (!widgetTypeId) {
        console.log(`  ⚠️  Widget type '${widgetDef.widget_type}' not found, skipping '${widgetDef.name}'`);
        continue;
      }

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
      console.log(`  ✓ Created: ${widgetDef.name}`);
    }

    // Step 6: Verify
    console.log('\nStep 6: Verification...');
    const layoutsResult = await database.query(
      'SELECT COUNT(*) FROM dashboard_layouts WHERE dashboard_id = $1',
      [dashboardId]
    );
    const layoutCount = parseInt(layoutsResult.rows[0].count);

    console.log('\n=== Seeding Complete ===');
    console.log(`Dashboard ID: ${dashboardId}`);
    console.log(`Total Widgets: ${layoutCount}`);
    console.log(`Owner User ID: ${userId}`);
    console.log('\n✅ Your dashboard is ready to load dynamically from the database!\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  }
}

if (require.main === module) {
  database.connect().then(async () => {
    try {
      await seedAllData();
      process.exit(0);
    } catch (error) {
      console.error('Fatal error:', error);
      process.exit(1);
    }
  });
}

module.exports = seedAllData;
