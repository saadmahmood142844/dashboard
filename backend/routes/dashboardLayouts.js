const express = require('express');
const router = express.Router();
const DashboardLayout = require('../models/DashboardLayout');
const Dashboard = require('../models/Dashboard');
const DashboardShare = require('../models/DashboardShare');
const WidgetDefinition = require('../models/WidgetDefinition');
const { protect } = require('../middleware/auth');

async function checkDashboardPermission(dashboardId, userId, requiredPermission = 'view') {
  const dashboard = await Dashboard.findById(dashboardId);
  if (!dashboard) {
    return { allowed: false, error: 'Dashboard not found', status: 404 };
  }

  if (dashboard.created_by === userId) {
    return { allowed: true, dashboard };
  }

  const permission = await DashboardShare.checkPermission(dashboardId, userId);

  if (!permission) {
    return { allowed: false, error: 'You do not have access to this dashboard', status: 403 };
  }

  const permissionLevels = { view: 1, edit: 2, admin: 3 };
  const userLevel = permissionLevels[permission] || 0;
  const requiredLevel = permissionLevels[requiredPermission] || 0;

  if (userLevel < requiredLevel) {
    return { allowed: false, error: 'Insufficient permissions', status: 403 };
  }

  return { allowed: true, dashboard };
}

router.get('/dashboard/:dashboardId', protect, async (req, res) => {
  try {
    const { dashboardId } = req.params;

    const permCheck = await checkDashboardPermission(dashboardId, req.user.id, 'view');
    if (!permCheck.allowed) {
      return res.status(permCheck.status).json({
        success: false,
        message: permCheck.error
      });
    }

    const layouts = await DashboardLayout.findByDashboardId(dashboardId);

    res.json({
      success: true,
      data: layouts,
      count: layouts.length
    });
  } catch (error) {
    console.error('Error fetching dashboard layouts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard layouts',
      error: error.message
    });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const layout = await DashboardLayout.findById(id);

    if (!layout) {
      return res.status(404).json({
        success: false,
        message: 'Layout not found'
      });
    }

    const permCheck = await checkDashboardPermission(layout.dashboard_id, req.user.id, 'view');
    if (!permCheck.allowed) {
      return res.status(permCheck.status).json({
        success: false,
        message: permCheck.error
      });
    }

    res.json({
      success: true,
      data: layout
    });
  } catch (error) {
    console.error('Error fetching layout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch layout',
      error: error.message
    });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const {
      dashboard_id,
      widget_definition_id,
      layout_config,
      instance_config,
      display_order
    } = req.body;

    if (!dashboard_id || !widget_definition_id) {
      return res.status(400).json({
        success: false,
        message: 'dashboard_id and widget_definition_id are required'
      });
    }

    const permCheck = await checkDashboardPermission(dashboard_id, req.user.id, 'edit');
    if (!permCheck.allowed) {
      return res.status(permCheck.status).json({
        success: false,
        message: permCheck.error
      });
    }

    const widgetDef = await WidgetDefinition.findById(widget_definition_id);
    if (!widgetDef) {
      return res.status(404).json({
        success: false,
        message: 'Widget definition not found'
      });
    }

    const layout = await DashboardLayout.create({
      dashboard_id,
      widget_definition_id,
      layout_config: layout_config || {},
      instance_config: instance_config || {},
      display_order: display_order || 0
    });

    await Dashboard.incrementVersion(dashboard_id);

    res.status(201).json({
      success: true,
      message: 'Widget added to dashboard successfully',
      data: layout
    });
  } catch (error) {
    console.error('Error adding widget to dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add widget to dashboard',
      error: error.message
    });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const layout = await DashboardLayout.findById(id);
    if (!layout) {
      return res.status(404).json({
        success: false,
        message: 'Layout not found'
      });
    }

    const permCheck = await checkDashboardPermission(layout.dashboard_id, req.user.id, 'edit');
    if (!permCheck.allowed) {
      return res.status(permCheck.status).json({
        success: false,
        message: permCheck.error
      });
    }

    const updatedLayout = await DashboardLayout.update(id, updateData);
    await Dashboard.incrementVersion(layout.dashboard_id);

    res.json({
      success: true,
      message: 'Layout updated successfully',
      data: updatedLayout
    });
  } catch (error) {
    console.error('Error updating layout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update layout',
      error: error.message
    });
  }
});

router.put('/dashboard/:dashboardId/bulk', protect, async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const { layouts } = req.body;

    if (!layouts || !Array.isArray(layouts)) {
      return res.status(400).json({
        success: false,
        message: 'layouts array is required'
      });
    }

    const permCheck = await checkDashboardPermission(dashboardId, req.user.id, 'edit');
    if (!permCheck.allowed) {
      return res.status(permCheck.status).json({
        success: false,
        message: permCheck.error
      });
    }

    const updatedLayouts = await DashboardLayout.bulkUpdateLayouts(dashboardId, layouts);
    await Dashboard.incrementVersion(dashboardId);

    res.json({
      success: true,
      message: 'Layouts updated successfully',
      data: updatedLayouts,
      count: updatedLayouts.length
    });
  } catch (error) {
    console.error('Error bulk updating layouts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update layouts',
      error: error.message
    });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const layout = await DashboardLayout.findById(id);
    if (!layout) {
      return res.status(404).json({
        success: false,
        message: 'Layout not found'
      });
    }

    const permCheck = await checkDashboardPermission(layout.dashboard_id, req.user.id, 'edit');
    if (!permCheck.allowed) {
      return res.status(permCheck.status).json({
        success: false,
        message: permCheck.error
      });
    }

    await DashboardLayout.delete(id);
    await Dashboard.incrementVersion(layout.dashboard_id);

    res.json({
      success: true,
      message: 'Widget removed from dashboard successfully'
    });
  } catch (error) {
    console.error('Error removing widget from dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove widget from dashboard',
      error: error.message
    });
  }
});

module.exports = router;
