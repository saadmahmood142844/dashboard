const database = require('../config/database');

class WidgetDefinition {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.widget_type_id = data.widget_type_id;
    this.data_source_config = data.data_source_config || {};
    this.layout_config = data.layout_config || {};
    this.created_by = data.created_by;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.widget_type_name = data.widget_type_name;
    this.component_name = data.component_name;
  }

  static async create(widgetDefData) {
    const {
      name,
      description,
      widget_type_id,
      data_source_config = {},
      layout_config = {},
      created_by
    } = widgetDefData;

    const query = `
      INSERT INTO widget_definitions
        (name, description, widget_type_id, data_source_config, layout_config, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await database.query(query, [
      name,
      description,
      widget_type_id,
      JSON.stringify(data_source_config),
      JSON.stringify(layout_config),
      created_by
    ]);

    return result.rows[0] ? new WidgetDefinition(result.rows[0]) : null;
  }

  static async findById(id) {
    const query = `
      SELECT
        wd.*,
        wt.name as widget_type_name,
        wt.component_name
      FROM widget_definitions wd
      JOIN widget_types wt ON wd.widget_type_id = wt.id
      WHERE wd.id = $1
    `;
    const result = await database.query(query, [id]);
    return result.rows[0] ? new WidgetDefinition(result.rows[0]) : null;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT
        wd.*,
        wt.name as widget_type_name,
        wt.component_name,
        u.name as creator_name
      FROM widget_definitions wd
      JOIN widget_types wt ON wd.widget_type_id = wt.id
      LEFT JOIN "user" u ON wd.created_by = u.id
    `;

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (filters.created_by) {
      conditions.push(`wd.created_by = $${paramIndex}`);
      values.push(filters.created_by);
      paramIndex++;
    }

    if (filters.widget_type_id) {
      conditions.push(`wd.widget_type_id = $${paramIndex}`);
      values.push(filters.widget_type_id);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY wd.created_at DESC';

    const result = await database.query(query, values);
    return result.rows.map(row => new WidgetDefinition(row));
  }

  static async update(id, updateData) {
    const allowedFields = ['name', 'description', 'widget_type_id', 'data_source_config', 'layout_config'];
    const updates = [];
    const values = [];
    let paramIndex = 2;

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        if (key === 'data_source_config' || key === 'layout_config') {
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
      UPDATE widget_definitions
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await database.query(query, values);
    return result.rows[0] ? new WidgetDefinition(result.rows[0]) : null;
  }

  static async delete(id) {
    const query = 'DELETE FROM widget_definitions WHERE id = $1 RETURNING *';
    const result = await database.query(query, [id]);
    return result.rows[0] ? new WidgetDefinition(result.rows[0]) : null;
  }
}

module.exports = WidgetDefinition;
