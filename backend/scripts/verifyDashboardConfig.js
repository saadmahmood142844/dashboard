const database = require('../config/database');

async function verifyDashboardConfig() {
  try {
    console.log('========================================');
    console.log('DASHBOARD CONFIGURATION VERIFICATION');
    console.log('========================================\n');

    // Check widget types
    console.log('1️⃣  WIDGET TYPES');
    console.log('─────────────────────────────────────');
    const widgetTypes = await database.query(
      'SELECT id, name, component_name FROM widget_types ORDER BY name'
    );
    console.log(`Found ${widgetTypes.rows.length} widget types:\n`);
    widgetTypes.rows.forEach(wt => {
      console.log(`  ✓ ${wt.name} (${wt.component_name})`);
    });

    // Check dashboards
    console.log('\n2️⃣  DASHBOARDS');
    console.log('─────────────────────────────────────');
    const dashboards = await database.query(
      'SELECT id, name, description, created_at FROM dashboards ORDER BY id'
    );
    console.log(`Found ${dashboards.rows.length} dashboard(s):\n`);
    dashboards.rows.forEach(d => {
      console.log(`  ✓ "${d.name}" (ID: ${d.id})`);
      console.log(`    Description: ${d.description || 'N/A'}`);
      console.log(`    Created: ${d.created_at}`);
    });

    if (dashboards.rows.length === 0) {
      console.log('\n⚠️  No dashboards found! Run: npm run seed:dashboard');
      return;
    }

    // Check widget definitions
    console.log('\n3️⃣  WIDGET DEFINITIONS');
    console.log('─────────────────────────────────────');
    const widgetDefs = await database.query(`
      SELECT
        wd.id,
        wd.name,
        wt.name as widget_type,
        wt.component_name,
        wd.data_source_config
      FROM widget_definitions wd
      JOIN widget_types wt ON wd.widget_type_id = wt.id
      ORDER BY wd.id
    `);
    console.log(`Found ${widgetDefs.rows.length} widget definition(s):\n`);
    widgetDefs.rows.forEach(wd => {
      console.log(`  ✓ ${wd.name}`);
      console.log(`    Type: ${wd.widget_type} (${wd.component_name})`);
      console.log(`    Config:`, JSON.parse(wd.data_source_config));
    });

    // Check dashboard layouts for each dashboard
    for (const dashboard of dashboards.rows) {
      console.log(`\n4️⃣  DASHBOARD LAYOUTS - "${dashboard.name}"`);
      console.log('─────────────────────────────────────');

      const layouts = await database.query(`
        SELECT
          dl.id,
          dl.display_order,
          wd.name as widget_name,
          wt.name as widget_type,
          wt.component_name,
          dl.layout_config,
          wd.data_source_config
        FROM dashboard_layouts dl
        JOIN widget_definitions wd ON dl.widget_definition_id = wd.id
        JOIN widget_types wt ON wd.widget_type_id = wt.id
        WHERE dl.dashboard_id = $1
        ORDER BY dl.display_order
      `, [dashboard.id]);

      console.log(`Found ${layouts.rows.length} widget(s) in this dashboard:\n`);

      if (layouts.rows.length === 0) {
        console.log('⚠️  No widgets in this dashboard!');
      } else {
        layouts.rows.forEach((layout, index) => {
          const layoutConfig = JSON.parse(layout.layout_config);
          const dataConfig = JSON.parse(layout.data_source_config);

          console.log(`  ${index + 1}. ${layout.widget_name}`);
          console.log(`     Type: ${layout.widget_type} (${layout.component_name})`);
          console.log(`     Position: x=${layoutConfig.x}, y=${layoutConfig.y}, w=${layoutConfig.w}, h=${layoutConfig.h}`);
          console.log(`     Display Order: ${layout.display_order}`);
          console.log(`     Data Config:`, dataConfig);
          console.log('');
        });
      }
    }

    // Summary
    console.log('\n========================================');
    console.log('SUMMARY');
    console.log('========================================');
    console.log(`✓ Widget Types: ${widgetTypes.rows.length}`);
    console.log(`✓ Dashboards: ${dashboards.rows.length}`);
    console.log(`✓ Widget Definitions: ${widgetDefs.rows.length}`);

    let totalWidgets = 0;
    for (const dashboard of dashboards.rows) {
      const layouts = await database.query(
        'SELECT COUNT(*) FROM dashboard_layouts WHERE dashboard_id = $1',
        [dashboard.id]
      );
      const count = parseInt(layouts.rows[0].count);
      totalWidgets += count;
      console.log(`✓ Widgets in "${dashboard.name}": ${count}`);
    }

    console.log('\n========================================');

    if (totalWidgets > 0) {
      console.log('✅ Dashboard configuration looks good!');
      console.log('\nTo verify on frontend:');
      console.log('1. Start backend: npm start');
      console.log('2. Start frontend: npm run dev');
      console.log('3. Open browser console (F12)');
      console.log('4. Look for logs starting with 🔄 🎨 📦');
    } else {
      console.log('⚠️  No widgets configured!');
      console.log('\nRun: npm run seed:dashboard');
    }

  } catch (error) {
    console.error('❌ Error verifying dashboard config:', error);
    throw error;
  }
}

if (require.main === module) {
  database.connect().then(async () => {
    try {
      await verifyDashboardConfig();
      process.exit(0);
    } catch (error) {
      console.error('Verification failed:', error);
      process.exit(1);
    }
  });
}

module.exports = verifyDashboardConfig;
