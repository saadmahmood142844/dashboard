/*
  # Widget System Schema Migration

  Creates a complete widget system for dynamic dashboards with drag-and-drop functionality.

  ## New Tables

  1. **widget_types**
     - `id` (uuid, primary key)
     - `name` (varchar) - Widget type identifier (e.g., 'gauge', 'line_chart')
     - `component_name` (varchar) - React component name
     - `default_config` (jsonb) - Default configuration
     - `created_at` (timestamp)

  2. **widget_definitions**
     - `id` (uuid, primary key)
     - `name` (varchar) - Widget name
     - `description` (text) - Widget description
     - `widget_type_id` (uuid) - FK to widget_types
     - `data_source_config` (jsonb) - API endpoints and data mapping
     - `layout_config` (jsonb) - Default layout settings
     - `created_by` (bigint) - FK to users
     - `created_at`, `updated_at` (timestamps)

  3. **dashboards**
     - `id` (uuid, primary key)
     - `name` (varchar) - Dashboard name
     - `description` (text)
     - `version` (integer) - Version number
     - `is_active` (boolean)
     - `grid_config` (jsonb) - Grid layout configuration
     - `created_by` (bigint) - FK to users
     - `created_at`, `updated_at` (timestamps)

  4. **dashboard_layouts**
     - `id` (uuid, primary key)
     - `dashboard_id` (uuid) - FK to dashboards
     - `widget_definition_id` (uuid) - FK to widget_definitions
     - `layout_config` (jsonb) - Position, size, constraints
     - `instance_config` (jsonb) - Widget-specific overrides
     - `display_order` (integer)
     - `created_at`, `updated_at` (timestamps)

  5. **dashboard_shares**
     - `id` (uuid, primary key)
     - `dashboard_id` (uuid) - FK to dashboards
     - `user_id` (bigint) - FK to users
     - `permission_level` (varchar) - 'view', 'edit', 'admin'
     - `shared_by` (bigint) - FK to users
     - `shared_at` (timestamp)
     - `expires_at` (timestamp)

  ## Security
  - All tables use UUID for better security
  - Foreign key constraints with proper cascading
  - Indexes for performance optimization
  - Updated_at triggers for automatic timestamp management

  ## Notes
  - Compatible with React Grid Layout library
  - Supports multi-tenant architecture
  - Allows widget sharing and collaboration
  - Version control for dashboards
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Widget types catalog table
CREATE TABLE IF NOT EXISTS widget_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    component_name VARCHAR(100) NOT NULL,
    default_config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Widget definitions table
CREATE TABLE IF NOT EXISTS widget_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    widget_type_id UUID NOT NULL REFERENCES widget_types(id) ON DELETE RESTRICT,

    -- Data source configuration
    data_source_config JSONB NOT NULL DEFAULT '{}',

    -- Default styling and configuration
    layout_config JSONB NOT NULL DEFAULT '{}',

    -- Ownership and timestamps
    created_by BIGINT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dashboards table
CREATE TABLE IF NOT EXISTS dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,

    -- Grid configuration
    grid_config JSONB NOT NULL DEFAULT '{
        "cols": 12,
        "rowHeight": 100,
        "margin": [10, 10],
        "breakpoints": { "lg": 1200, "md": 996, "sm": 768, "xs": 480, "xxs": 0 },
        "containerPadding": [10, 10]
    }',

    -- Ownership and timestamps
    created_by BIGINT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dashboard layouts table
CREATE TABLE IF NOT EXISTS dashboard_layouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    widget_definition_id UUID NOT NULL REFERENCES widget_definitions(id) ON DELETE CASCADE,

    -- Grid layout configuration
    layout_config JSONB NOT NULL DEFAULT '{
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 2,
        "minW": 2,
        "minH": 1,
        "static": false
    }',

    -- Widget instance configuration
    instance_config JSONB NOT NULL DEFAULT '{}',

    -- Display order
    display_order INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ensure unique widget position per dashboard
    UNIQUE(dashboard_id, widget_definition_id)
);

-- Dashboard sharing table
CREATE TABLE IF NOT EXISTS dashboard_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    permission_level VARCHAR(20) NOT NULL DEFAULT 'view',
    shared_by BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(dashboard_id, user_id),

    CHECK (permission_level IN ('view', 'edit', 'admin'))
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_widget_definitions_created_by ON widget_definitions(created_by);
CREATE INDEX IF NOT EXISTS idx_widget_definitions_widget_type_id ON widget_definitions(widget_type_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_created_by ON dashboards(created_by);
CREATE INDEX IF NOT EXISTS idx_dashboards_is_active ON dashboards(is_active);
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_dashboard_id ON dashboard_layouts(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_widget_def_id ON dashboard_layouts(widget_definition_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_shares_dashboard_id ON dashboard_shares(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_shares_user_id ON dashboard_shares(user_id);

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
CREATE TRIGGER update_widget_definitions_updated_at
    BEFORE UPDATE ON widget_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboards_updated_at
    BEFORE UPDATE ON dashboards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_layouts_updated_at
    BEFORE UPDATE ON dashboard_layouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
