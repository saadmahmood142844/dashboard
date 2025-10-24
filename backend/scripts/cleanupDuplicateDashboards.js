const database = require('../config/database');

async function cleanupDuplicateDashboards() {
  try {
    console.log('\n=== Cleaning Up Duplicate Dashboards ===\n');

    // Get all dashboards with the same name for each user
    const query = `
      SELECT
        d.id,
        d.name,
        d.created_by,
        d.created_at,
        COUNT(dl.id) as widget_count
      FROM dashboards d
      LEFT JOIN dashboard_layouts dl ON d.id = dl.dashboard_id
      WHERE d.name = 'Production Dashboard'
      GROUP BY d.id, d.name, d.created_by, d.created_at
      ORDER BY d.created_by, d.created_at ASC
    `;

    const result = await database.query(query);
    console.log(`Found ${result.rows.length} 'Production Dashboard' instances:\n`);

    // Group by user
    const byUser = {};
    result.rows.forEach(row => {
      if (!byUser[row.created_by]) {
        byUser[row.created_by] = [];
      }
      byUser[row.created_by].push(row);
    });

    // For each user, keep only the dashboard with most widgets (or the latest one)
    for (const [userId, dashboards] of Object.entries(byUser)) {
      console.log(`\nUser ID ${userId} has ${dashboards.length} dashboard(s):`);

      dashboards.forEach((d, idx) => {
        console.log(`  ${idx + 1}. ID: ${d.id}, Widgets: ${d.widget_count}, Created: ${d.created_at}`);
      });

      if (dashboards.length > 1) {
        // Sort by widget count descending, then by created_at descending
        dashboards.sort((a, b) => {
          if (b.widget_count !== a.widget_count) {
            return b.widget_count - a.widget_count;
          }
          return new Date(b.created_at) - new Date(a.created_at);
        });

        const keepDashboard = dashboards[0];
        const deleteDashboards = dashboards.slice(1);

        console.log(`\n  ✓ Keeping dashboard: ${keepDashboard.id} (${keepDashboard.widget_count} widgets)`);

        for (const delDash of deleteDashboards) {
          console.log(`  🗑️  Deleting dashboard: ${delDash.id} (${delDash.widget_count} widgets)`);

          // Delete layouts first
          await database.query('DELETE FROM dashboard_layouts WHERE dashboard_id = $1', [delDash.id]);

          // Delete shares
          await database.query('DELETE FROM dashboard_shares WHERE dashboard_id = $1', [delDash.id]);

          // Delete dashboard
          await database.query('DELETE FROM dashboards WHERE id = $1', [delDash.id]);
        }

        console.log(`  ✅ Cleaned up ${deleteDashboards.length} duplicate dashboard(s)`);
      } else {
        console.log(`  ✓ No duplicates to clean up`);
      }
    }

    // Verify final state
    const finalResult = await database.query(
      `SELECT COUNT(*) as count FROM dashboards WHERE name = 'Production Dashboard'`
    );
    console.log(`\n=== Cleanup Complete ===`);
    console.log(`Remaining 'Production Dashboard' instances: ${finalResult.rows[0].count}\n`);

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    throw error;
  }
}

if (require.main === module) {
  database.connect().then(async () => {
    try {
      await cleanupDuplicateDashboards();
      process.exit(0);
    } catch (error) {
      console.error('Fatal error:', error);
      process.exit(1);
    }
  });
}

module.exports = cleanupDuplicateDashboards;
