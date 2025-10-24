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

    // Define widget definitions for current dashboard components
    const widgetDefinitions = [
      {
        name: 'OFR KPI Card',
        description: 'Oil Flow Rate KPI metric card',
        widget_type: 'kpi',
        data_source_config: { metric: 'ofr', unit: 'l/min' },
        layout_config: { x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
        display_order: 1
      },
      {
        name: 'WFR KPI Card',
        description: 'Water Flow Rate KPI metric card',
        widget_type: 'kpi',
        data_source_config: { metric: 'wfr', unit: 'l/min' },
        layout_config: { x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
        display_order: 2
      },
      {
        name: 'GFR KPI Card',
        description: 'Gas Flow Rate KPI metric card',
        widget_type: 'kpi',
        data_source_config: { metric: 'gfr', unit: 'l/min' },
        layout_config: { x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
        display_order: 3
      },
      {
        name: 'Last Refresh Card',
        description: 'Last data refresh timestamp card',
        widget_type: 'kpi',
        data_source_config: { metric: 'last_refresh' },
        layout_config: { x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
        display_order: 4
      },
      {
        name: 'OFR Line Chart',
        description: 'Oil Flow Rate trend line chart',
        widget_type: 'line_chart',
        data_source_config: {
          metric: 'ofr',
          timeRange: 'dynamic',
          yAxisLabel: 'OFR (l/min)',
          showOil: true,
          showGas: false,
          showWater: false
        },
        layout_config: { x: 0, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
        display_order: 5
      },
      {
        name: 'WFR Line Chart',
        description: 'Water Flow Rate trend line chart',
        widget_type: 'line_chart',
        data_source_config: {
          metric: 'wfr',
          timeRange: 'dynamic',
          yAxisLabel: 'WFR (l/min)',
          showOil: false,
          showGas: false,
          showWater: true
        },
        layout_config: { x: 6, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
        display_order: 6
      },
      {
        name: 'GFR Line Chart',
        description: 'Gas Flow Rate trend line chart',
        widget_type: 'line_chart',
        data_source_config: {
          metric: 'gfr',
          timeRange: 'dynamic',
          yAxisLabel: 'GFR (l/min)',
          showOil: false,
          showGas: true,
          showWater: false
        },
        layout_config: { x: 0, y: 6, w: 6, h: 4, minW: 4, minH: 3 },
        display_order: 7
      },
      {
        name: 'Fractions Chart',
        description: 'Production fractions (GVF/WLR) line chart',
        widget_type: 'line_chart',
        data_source_config: {
          metric: 'fractions',
          metrics: ['gvf', 'wlr'],
          yAxisLabel: 'Percentage (%)'
        },
        layout_config: { x: 0, y: 6, w: 6, h: 4, minW: 4, minH: 3 },
        display_order: 8
      },
      {
        name: 'GVF/WLR Donut Charts',
        description: 'Gas Volume Fraction and Water Liquid Ratio circular donut charts',
        widget_type: 'donut_chart',
        data_source_config: {
          metrics: ['gvf', 'wlr'],
          showLabels: true,
          showLegend: true
        },
        layout_config: { x: 6, y: 6, w: 6, h: 4, minW: 4, minH: 3 },
        display_order: 9
      },
      {
        name: 'Production Map',
        description: 'Geographic production visualization map',
        widget_type: 'map',
        data_source_config: {
          showDevices: true,
          showHierarchy: true,
          clusterMarkers: true
        },
        layout_config: { x: 0, y: 15, w: 12, h: 6, minW: 6, minH: 4 },
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
