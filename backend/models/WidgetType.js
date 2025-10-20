const database = require('../config/database');

class WidgetType {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.component_name = data.component_name;
    this.default_config = data.default_config || {};
    this.created_at = data.created_at;
  }

  static async create(widgetTypeData) {
    const { name, component_name, default_config = {} } = widgetTypeData;

    const query = `
      INSERT INTO widget_types (name, component_name, default_config)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await database.query(query, [
      name,
      component_name,
      JSON.stringify(default_config)
    ]);

    return result.rows[0] ? new WidgetType(result.rows[0]) : null;
  }

  static async findById(id) {
    const query = 'SELECT * FROM widget_types WHERE id = $1';
    const result = await database.query(query, [id]);
    return result.rows[0] ? new WidgetType(result.rows[0]) : null;
  }

  static async findByName(name) {
    const query = 'SELECT * FROM widget_types WHERE name = $1';
    const result = await database.query(query, [name]);
    return result.rows[0] ? new WidgetType(result.rows[0]) : null;
  }

  static async findAll() {
    const query = 'SELECT * FROM widget_types ORDER BY name ASC';
    const result = await database.query(query);
    return result.rows.map(row => new WidgetType(row));
  }

  static async update(id, updateData) {
    const allowedFields = ['name', 'component_name', 'default_config'];
    const updates = [];
    const values = [];
    let paramIndex = 2;

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        if (key === 'default_config') {
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

    values.unshift(id);

    const query = `
      UPDATE widget_types
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await database.query(query, values);
    return result.rows[0] ? new WidgetType(result.rows[0]) : null;
  }

  static async delete(id) {
    const query = 'DELETE FROM widget_types WHERE id = $1 RETURNING *';
    const result = await database.query(query, [id]);
    return result.rows[0] ? new WidgetType(result.rows[0]) : null;
  }
}

module.exports = WidgetType;
