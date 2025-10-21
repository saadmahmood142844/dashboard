const express = require('express');
const router = express.Router();
const Dashboard = require('../models/Dashboard');
const DashboardLayout = require('../models/DashboardLayout');
const DashboardShare = require('../models/DashboardShare');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const includeShared = req.query.include_shared !== 'false';
    const dashboards = await Dashboard.findByUserId(req.user.id, includeShared);

    res.json({
      success: true,
      data: dashboards,
      count: dashboards.length
    });
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboards',
      error: error.message
    });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const dashboard = await Dashboard.findById(id);

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    const permission = await DashboardShare.checkPermission(id, req.user.id);

    if (!permission && dashboard.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this dashboard'
      });
    }

    const layouts = await DashboardLayout.findByDashboardId(id);

    res.json({
      success: true,
      data: {
        ...dashboard,
        layouts,
        permission: permission || 'owner'
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard',
      error: error.message
    });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { name, description, grid_config, widgets } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Dashboard name is required'
      });
    }

    const dashboard = await Dashboard.create({
      name,
      description,
      grid_config,
      created_by: req.user.id
    });

    if (widgets && Array.isArray(widgets) && widgets.length > 0) {
      for (let i = 0; i < widgets.length; i++) {
        const widget = widgets[i];
        await DashboardLayout.create({
          dashboard_id: dashboard.id,
          widget_definition_id: widget.widget_definition_id,
          layout_config: widget.layout_config,
          instance_config: widget.instance_config || {},
          display_order: i
        });
      }
    }

    const layouts = await DashboardLayout.findByDashboardId(dashboard.id);

    res.status(201).json({
      success: true,
      message: 'Dashboard created successfully',
      data: {
        ...dashboard,
        layouts
      }
    });
  } catch (error) {
    console.error('Error creating dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create dashboard',
      error: error.message
    });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const dashboard = await Dashboard.findById(id);
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    const permission = await DashboardShare.checkPermission(id, req.user.id);

    if (dashboard.created_by !== req.user.id && permission !== 'edit' && permission !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this dashboard'
      });
    }

    const updatedDashboard = await Dashboard.update(id, updateData);

    res.json({
      success: true,
      message: 'Dashboard updated successfully',
      data: updatedDashboard
    });
  } catch (error) {
    console.error('Error updating dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update dashboard',
      error: error.message
    });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const dashboard = await Dashboard.findById(id);
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    if (dashboard.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this dashboard'
      });
    }

    await Dashboard.delete(id);

    res.json({
      success: true,
      message: 'Dashboard deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete dashboard',
      error: error.message
    });
  }
});

router.post('/:id/duplicate', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const originalDashboard = await Dashboard.findById(id);
    if (!originalDashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    const permission = await DashboardShare.checkPermission(id, req.user.id);
    if (!permission && originalDashboard.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to duplicate this dashboard'
      });
    }

    const newDashboard = await Dashboard.create({
      name: name || `${originalDashboard.name} (Copy)`,
      description: originalDashboard.description,
      grid_config: originalDashboard.grid_config,
      created_by: req.user.id
    });

    const originalLayouts = await DashboardLayout.findByDashboardId(id);
    for (const layout of originalLayouts) {
      await DashboardLayout.create({
        dashboard_id: newDashboard.id,
        widget_definition_id: layout.widget_definition_id,
        layout_config: layout.layout_config,
        instance_config: layout.instance_config,
        display_order: layout.display_order
      });
    }

    const layouts = await DashboardLayout.findByDashboardId(newDashboard.id);

    res.status(201).json({
      success: true,
      message: 'Dashboard duplicated successfully',
      data: {
        ...newDashboard,
        layouts
      }
    });
  } catch (error) {
    console.error('Error duplicating dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate dashboard',
      error: error.message
    });
  }
});

router.get('/:id/shares', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const dashboard = await Dashboard.findById(id);
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    if (dashboard.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only dashboard owner can view sharing settings'
      });
    }

    const shares = await DashboardShare.findByDashboardId(id);

    res.json({
      success: true,
      data: shares,
      count: shares.length
    });
  } catch (error) {
    console.error('Error fetching dashboard shares:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard shares',
      error: error.message
    });
  }
});

router.post('/:id/share', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, permission_level, expires_at } = req.body;

    if (!user_id || !permission_level) {
      return res.status(400).json({
        success: false,
        message: 'user_id and permission_level are required'
      });
    }

    const dashboard = await Dashboard.findById(id);
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    if (dashboard.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only dashboard owner can share the dashboard'
      });
    }

    const share = await DashboardShare.create({
      dashboard_id: id,
      user_id,
      permission_level,
      shared_by: req.user.id,
      expires_at
    });

    res.status(201).json({
      success: true,
      message: 'Dashboard shared successfully',
      data: share
    });
  } catch (error) {
    console.error('Error sharing dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share dashboard',
      error: error.message
    });
  }
});

router.delete('/:id/share/:userId', protect, async (req, res) => {
  try {
    const { id, userId } = req.params;

    const dashboard = await Dashboard.findById(id);
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    if (dashboard.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only dashboard owner can revoke access'
      });
    }

    await DashboardShare.revokeAccess(id, userId);

    res.json({
      success: true,
      message: 'Dashboard access revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking dashboard access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke dashboard access',
      error: error.message
    });
  }
});

module.exports = router;
