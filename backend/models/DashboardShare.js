const database = require('../config/database');

class DashboardShare {
  constructor(data = {}) {
    this.id = data.id;
    this.dashboard_id = data.dashboard_id;
    this.user_id = data.user_id;
    this.permission_level = data.permission_level || 'view';
    this.shared_by = data.shared_by;
    this.shared_at = data.shared_at;
    this.expires_at = data.expires_at;
    this.user_name = data.user_name;
    this.user_email = data.user_email;
    this.shared_by_name = data.shared_by_name;
  }

  static async create(shareData) {
    const {
      dashboard_id,
      user_id,
      permission_level = 'view',
      shared_by,
      expires_at
    } = shareData;

    const query = `
      INSERT INTO dashboard_shares
        (dashboard_id, user_id, permission_level, shared_by, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await database.query(query, [
      dashboard_id,
      user_id,
      permission_level,
      shared_by,
      expires_at
    ]);

    return result.rows[0] ? new DashboardShare(result.rows[0]) : null;
  }

  static async findById(id) {
    const query = `
      SELECT
        ds.*,
        u.name as user_name,
        u.email as user_email,
        sb.name as shared_by_name
      FROM dashboard_shares ds
      JOIN "user" u ON ds.user_id = u.id
      LEFT JOIN "user" sb ON ds.shared_by = sb.id
      WHERE ds.id = $1
    `;
    const result = await database.query(query, [id]);
    return result.rows[0] ? new DashboardShare(result.rows[0]) : null;
  }

  static async findByDashboardId(dashboardId) {
    const query = `
      SELECT
        ds.*,
        u.name as user_name,
        u.email as user_email,
        sb.name as shared_by_name
      FROM dashboard_shares ds
      JOIN "user" u ON ds.user_id = u.id
      LEFT JOIN "user" sb ON ds.shared_by = sb.id
      WHERE ds.dashboard_id = $1
      AND (ds.expires_at IS NULL OR ds.expires_at > CURRENT_TIMESTAMP)
      ORDER BY ds.shared_at DESC
    `;
    const result = await database.query(query, [dashboardId]);
    return result.rows.map(row => new DashboardShare(row));
  }

  static async findByUserId(userId) {
    const query = `
      SELECT
        ds.*,
        d.name as dashboard_name,
        sb.name as shared_by_name
      FROM dashboard_shares ds
      JOIN dashboards d ON ds.dashboard_id = d.id
      LEFT JOIN "user" sb ON ds.shared_by = sb.id
      WHERE ds.user_id = $1
      AND (ds.expires_at IS NULL OR ds.expires_at > CURRENT_TIMESTAMP)
      ORDER BY ds.shared_at DESC
    `;
    const result = await database.query(query, [userId]);
    return result.rows.map(row => new DashboardShare(row));
  }

  static async checkPermission(dashboardId, userId) {
    const query = `
      SELECT
        CASE
          WHEN d.created_by = $2 THEN 'admin'
          ELSE ds.permission_level
        END as permission_level
      FROM dashboards d
      LEFT JOIN dashboard_shares ds ON d.id = ds.dashboard_id AND ds.user_id = $2
      WHERE d.id = $1
      AND (ds.expires_at IS NULL OR ds.expires_at > CURRENT_TIMESTAMP OR d.created_by = $2)
    `;
    const result = await database.query(query, [dashboardId, userId]);
    return result.rows[0] ? result.rows[0].permission_level : null;
  }

  static async update(id, updateData) {
    const allowedFields = ['permission_level', 'expires_at'];
    const updates = [];
    const values = [];
    let paramIndex = 2;

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(updateData[key]);
        paramIndex++;
      }
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.unshift(id);

    const query = `
      UPDATE dashboard_shares
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await database.query(query, values);
    return result.rows[0] ? new DashboardShare(result.rows[0]) : null;
  }

  static async delete(id) {
    const query = 'DELETE FROM dashboard_shares WHERE id = $1 RETURNING *';
    const result = await database.query(query, [id]);
    return result.rows[0] ? new DashboardShare(result.rows[0]) : null;
  }

  static async revokeAccess(dashboardId, userId) {
    const query = 'DELETE FROM dashboard_shares WHERE dashboard_id = $1 AND user_id = $2 RETURNING *';
    const result = await database.query(query, [dashboardId, userId]);
    return result.rows[0] ? new DashboardShare(result.rows[0]) : null;
  }
}

module.exports = DashboardShare;
