const express = require('express');
const router = express.Router();
const WidgetDefinition = require('../models/WidgetDefinition');
const WidgetType = require('../models/WidgetType');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const filters = {};

    if (req.query.widget_type_id) {
      filters.widget_type_id = req.query.widget_type_id;
    }

    if (req.query.my_widgets === 'true') {
      filters.created_by = req.user.id;
    }

    const widgetDefinitions = await WidgetDefinition.findAll(filters);

    res.json({
      success: true,
      data: widgetDefinitions,
      count: widgetDefinitions.length
    });
  } catch (error) {
    console.error('Error fetching widget definitions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch widget definitions',
      error: error.message
    });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const widgetDefinition = await WidgetDefinition.findById(id);

    if (!widgetDefinition) {
      return res.status(404).json({
        success: false,
        message: 'Widget definition not found'
      });
    }

    res.json({
      success: true,
      data: widgetDefinition
    });
  } catch (error) {
    console.error('Error fetching widget definition:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch widget definition',
      error: error.message
    });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const {
      name,
      description,
      widget_type_id,
      data_source_config,
      layout_config
    } = req.body;

    if (!name || !widget_type_id) {
      return res.status(400).json({
        success: false,
        message: 'Name and widget_type_id are required'
      });
    }

    const widgetType = await WidgetType.findById(widget_type_id);
    if (!widgetType) {
      return res.status(404).json({
        success: false,
        message: 'Widget type not found'
      });
    }

    const widgetDefinition = await WidgetDefinition.create({
      name,
      description,
      widget_type_id,
      data_source_config: data_source_config || {},
      layout_config: layout_config || {},
      created_by: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Widget definition created successfully',
      data: widgetDefinition
    });
  } catch (error) {
    console.error('Error creating widget definition:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create widget definition',
      error: error.message
    });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const widgetDefinition = await WidgetDefinition.findById(id);
    if (!widgetDefinition) {
      return res.status(404).json({
        success: false,
        message: 'Widget definition not found'
      });
    }

    if (widgetDefinition.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this widget'
      });
    }

    if (updateData.widget_type_id) {
      const widgetType = await WidgetType.findById(updateData.widget_type_id);
      if (!widgetType) {
        return res.status(404).json({
          success: false,
          message: 'Widget type not found'
        });
      }
    }

    const updatedWidgetDefinition = await WidgetDefinition.update(id, updateData);

    res.json({
      success: true,
      message: 'Widget definition updated successfully',
      data: updatedWidgetDefinition
    });
  } catch (error) {
    console.error('Error updating widget definition:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update widget definition',
      error: error.message
    });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const widgetDefinition = await WidgetDefinition.findById(id);
    if (!widgetDefinition) {
      return res.status(404).json({
        success: false,
        message: 'Widget definition not found'
      });
    }

    if (widgetDefinition.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this widget'
      });
    }

    await WidgetDefinition.delete(id);

    res.json({
      success: true,
      message: 'Widget definition deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting widget definition:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete widget definition',
      error: error.message
    });
  }
});

module.exports = router;
