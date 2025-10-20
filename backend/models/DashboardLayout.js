const database = require('../config/database');

class DashboardLayout {
  constructor(data = {}) {
    this.id = data.id;
    this.dashboard_id = data.dashboard_id;
    this.widget_definition_id = data.widget_definition_id;
    this.layout_config = data.layout_config || {};
    this.instance_config = data.instance_config || {};
    this.display_order = data.display_order || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.widget_name = data.widget_name;
    this.widget_type_name = data.widget_type_name;
    this.component_name = data.component_name;
    this.data_source_config = data.data_source_config;
  }

  static async create(layoutData) {
    const {
      dashboard_id,
      widget_definition_id,
      layout_config = {},
      instance_config = {},
      display_order = 0
    } = layoutData;

    const defaultLayoutConfig = {
      x: 0,
      y: 0,
      w: 4,
      h: 2,
      minW: 2,
      minH: 1,
      static: false
    };

    const query = `
      INSERT INTO dashboard_layouts
        (dashboard_id, widget_definition_id, layout_config, instance_config, display_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await database.query(query, [
      dashboard_id,
      widget_definition_id,
      JSON.stringify({ ...defaultLayoutConfig, ...layout_config }),
      JSON.stringify(instance_config),
      display_order
    ]);

    return result.rows[0] ? new DashboardLayout(result.rows[0]) : null;
  }

  static async findById(id) {
    const query = `
      SELECT
        dl.*,
        wd.name as widget_name,
        wd.data_source_config,
        wt.name as widget_type_name,
        wt.component_name
      FROM dashboard_layouts dl
      JOIN widget_definitions wd ON dl.widget_definition_id = wd.id
      JOIN widget_types wt ON wd.widget_type_id = wt.id
      WHERE dl.id = $1
    `;
    const result = await database.query(query, [id]);
    return result.rows[0] ? new DashboardLayout(result.rows[0]) : null;
  }

  static async findByDashboardId(dashboardId) {
    const query = `
      SELECT
        dl.*,
        wd.name as widget_name,
        wd.description as widget_description,
        wd.data_source_config,
        wt.name as widget_type_name,
        wt.component_name,
        wt.default_config as widget_default_config
      FROM dashboard_layouts dl
      JOIN widget_definitions wd ON dl.widget_definition_id = wd.id
      JOIN widget_types wt ON wd.widget_type_id = wt.id
      WHERE dl.dashboard_id = $1
      ORDER BY dl.display_order ASC, dl.created_at ASC
    `;
    const result = await database.query(query, [dashboardId]);
    return result.rows.map(row => new DashboardLayout(row));
  }

  static async update(id, updateData) {
    const allowedFields = ['layout_config', 'instance_config', 'display_order'];
    const updates = [];
    const values = [];
    let paramIndex = 2;

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        if (key === 'layout_config' || key === 'instance_config') {
          updates.push(`${key} = $${paramIndex}`);
          values.push(JSON.stringify(updateData[key]));
        } else {
          updates.push(`${key} = $${paramIndex}`);
          values.push(updateData[key]);
        }
        paramIndex++;
      }
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.unshift(id);

    const query = `
      UPDATE dashboard_layouts
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await database.query(query, values);
    return result.rows[0] ? new DashboardLayout(result.rows[0]) : null;
  }

  static async bulkUpdateLayouts(dashboardId, layoutsData) {
    const client = await database.pool.connect();
    try {
      await client.query('BEGIN');

      const updatedLayouts = [];
      for (const layoutData of layoutsData) {
        const { id, layout_config, instance_config, display_order } = layoutData;

        const query = `
          UPDATE dashboard_layouts
          SET
            layout_config = $1,
            instance_config = COALESCE($2, instance_config),
            display_order = COALESCE($3, display_order),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $4 AND dashboard_id = $5
          RETURNING *
        `;

        const result = await client.query(query, [
          JSON.stringify(layout_config),
          instance_config ? JSON.stringify(instance_config) : null,
          display_order,
          id,
          dashboardId
        ]);

        if (result.rows[0]) {
          updatedLayouts.push(new DashboardLayout(result.rows[0]));
        }
      }

      await client.query('COMMIT');
      return updatedLayouts;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM dashboard_layouts WHERE id = $1 RETURNING *';
    const result = await database.query(query, [id]);
    return result.rows[0] ? new DashboardLayout(result.rows[0]) : null;
  }

  static async deleteByDashboardId(dashboardId) {
    const query = 'DELETE FROM dashboard_layouts WHERE dashboard_id = $1 RETURNING *';
    const result = await database.query(query, [dashboardId]);
    return result.rows.map(row => new DashboardLayout(row));
  }
}

module.exports = DashboardLayout;
