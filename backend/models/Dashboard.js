const database = require('../config/database');

class Dashboard {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.version = data.version || 1;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.grid_config = data.grid_config || {};
    this.created_by = data.created_by;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.creator_name = data.creator_name;
  }

  static async create(dashboardData) {
    const {
      name,
      description,
      grid_config,
      created_by
    } = dashboardData;

    const defaultGridConfig = {
      cols: 12,
      rowHeight: 100,
      margin: [10, 10],
      breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
      containerPadding: [10, 10]
    };

    const query = `
      INSERT INTO dashboards
        (name, description, grid_config, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await database.query(query, [
      name,
      description,
      JSON.stringify(grid_config || defaultGridConfig),
      created_by
    ]);

    return result.rows[0] ? new Dashboard(result.rows[0]) : null;
  }

  static async findById(id) {
    const query = `
      SELECT
        d.*,
        u.name as creator_name
      FROM dashboards d
      LEFT JOIN "user" u ON d.created_by = u.id
      WHERE d.id = $1
    `;
    const result = await database.query(query, [id]);
    return result.rows[0] ? new Dashboard(result.rows[0]) : null;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT
        d.*,
        u.name as creator_name
      FROM dashboards d
      LEFT JOIN "user" u ON d.created_by = u.id
    `;

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (filters.created_by) {
      conditions.push(`d.created_by = $${paramIndex}`);
      values.push(filters.created_by);
      paramIndex++;
    }

    if (filters.is_active !== undefined) {
      conditions.push(`d.is_active = $${paramIndex}`);
      values.push(filters.is_active);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY d.updated_at DESC';

    const result = await database.query(query, values);
    return result.rows.map(row => new Dashboard(row));
  }

  static async findByUserId(userId, includeShared = true) {
    let query = `
      SELECT DISTINCT
        d.*,
        u.name as creator_name
      FROM dashboards d
      LEFT JOIN "user" u ON d.created_by = u.id
      WHERE d.created_by = $1
    `;

    if (includeShared) {
      query = `
        SELECT DISTINCT
          d.*,
          u.name as creator_name,
          CASE
            WHEN d.created_by = $1 THEN 'owner'
            ELSE ds.permission_level
          END as permission
        FROM dashboards d
        LEFT JOIN "user" u ON d.created_by = u.id
        LEFT JOIN dashboard_shares ds ON d.id = ds.dashboard_id
        WHERE d.created_by = $1 OR ds.user_id = $1
      `;
    }

    query += ' ORDER BY d.updated_at DESC';

    const result = await database.query(query, [userId]);
    return result.rows.map(row => new Dashboard(row));
  }

  static async update(id, updateData) {
    const allowedFields = ['name', 'description', 'version', 'is_active', 'grid_config'];
    const updates = [];
    const values = [];
    let paramIndex = 2;

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        if (key === 'grid_config') {
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
      UPDATE dashboards
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await database.query(query, values);
    return result.rows[0] ? new Dashboard(result.rows[0]) : null;
  }

  static async delete(id) {
    const query = 'DELETE FROM dashboards WHERE id = $1 RETURNING *';
    const result = await database.query(query, [id]);
    return result.rows[0] ? new Dashboard(result.rows[0]) : null;
  }

  static async incrementVersion(id) {
    const query = `
      UPDATE dashboards
      SET version = version + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await database.query(query, [id]);
    return result.rows[0] ? new Dashboard(result.rows[0]) : null;
  }
}

module.exports = Dashboard;
