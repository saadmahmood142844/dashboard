const express = require('express');
const router = express.Router();
const WidgetType = require('../models/WidgetType');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const widgetTypes = await WidgetType.findAll();

    res.json({
      success: true,
      data: widgetTypes,
      count: widgetTypes.length
    });
  } catch (error) {
    console.error('Error fetching widget types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch widget types',
      error: error.message
    });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const widgetType = await WidgetType.findById(id);

    if (!widgetType) {
      return res.status(404).json({
        success: false,
        message: 'Widget type not found'
      });
    }

    res.json({
      success: true,
      data: widgetType
    });
  } catch (error) {
    console.error('Error fetching widget type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch widget type',
      error: error.message
    });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can create widget types'
      });
    }

    const { name, component_name, default_config } = req.body;

    if (!name || !component_name) {
      return res.status(400).json({
        success: false,
        message: 'Name and component_name are required'
      });
    }

    const existingWidget = await WidgetType.findByName(name);
    if (existingWidget) {
      return res.status(409).json({
        success: false,
        message: 'Widget type with this name already exists'
      });
    }

    const widgetType = await WidgetType.create({
      name,
      component_name,
      default_config: default_config || {}
    });

    res.status(201).json({
      success: true,
      message: 'Widget type created successfully',
      data: widgetType
    });
  } catch (error) {
    console.error('Error creating widget type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create widget type',
      error: error.message
    });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update widget types'
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    const widgetType = await WidgetType.findById(id);
    if (!widgetType) {
      return res.status(404).json({
        success: false,
        message: 'Widget type not found'
      });
    }

    const updatedWidgetType = await WidgetType.update(id, updateData);

    res.json({
      success: true,
      message: 'Widget type updated successfully',
      data: updatedWidgetType
    });
  } catch (error) {
    console.error('Error updating widget type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update widget type',
      error: error.message
    });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete widget types'
      });
    }

    const { id } = req.params;

    const widgetType = await WidgetType.findById(id);
    if (!widgetType) {
      return res.status(404).json({
        success: false,
        message: 'Widget type not found'
      });
    }

    await WidgetType.delete(id);

    res.json({
      success: true,
      message: 'Widget type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting widget type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete widget type',
      error: error.message
    });
  }
});

module.exports = router;
