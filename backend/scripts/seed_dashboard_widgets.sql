-- ===================================================================
-- Dashboard Widget Seeding Script
-- This script will populate your database with widget types,
-- widget definitions, and dashboard layouts for dynamic widget loading
-- ===================================================================

-- Step 1: Insert Widget Types
DO $$
BEGIN
    -- KPI Widget Type
    IF NOT EXISTS (SELECT 1 FROM widget_types WHERE name = 'kpi') THEN
        INSERT INTO widget_types (name, component_name, default_config)
        VALUES (
            'kpi',
            'KPIWidget',
            '{"format": "number", "unit": "", "showTrend": true, "trendPeriod": "24h", "size": "medium"}'::jsonb
        );
    END IF;

    -- Line Chart Widget Type
    IF NOT EXISTS (SELECT 1 FROM widget_types WHERE name = 'line_chart') THEN
        INSERT INTO widget_types (name, component_name, default_config)
        VALUES (
            'line_chart',
            'LineChartWidget',
            '{"timeRange": "24h", "yAxisLabel": "", "xAxisLabel": "Time", "showGrid": true, "showLegend": true, "curveType": "smooth", "colors": ["#3b82f6", "#8b5cf6", "#ec4899"]}'::jsonb
        );
    END IF;

    -- Donut Chart Widget Type
    IF NOT EXISTS (SELECT 1 FROM widget_types WHERE name = 'donut_chart') THEN
        INSERT INTO widget_types (name, component_name, default_config)
        VALUES (
            'donut_chart',
            'DonutChartWidget',
            '{"showLegend": true, "showLabels": true, "innerRadius": 0.6, "colors": ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]}'::jsonb
        );
    END IF;

    -- Map Widget Type
    IF NOT EXISTS (SELECT 1 FROM widget_types WHERE name = 'map') THEN
        INSERT INTO widget_types (name, component_name, default_config)
        VALUES (
            'map',
            'MapWidget',
            '{"center": [0, 0], "zoom": 5, "markerType": "default", "clusterMarkers": true, "showPopup": true}'::jsonb
        );
    END IF;
END $$;

-- Step 2: Create or Update Dashboard
DO $$
DECLARE
    v_user_id UUID;
    v_dashboard_id UUID;
    v_widget_type_kpi UUID;
    v_widget_type_line UUID;
    v_widget_type_donut UUID;
    v_widget_type_map UUID;
    v_widget_def_id UUID;
BEGIN
    -- Get the first user (assumes you have at least one user)
    SELECT id INTO v_user_id FROM "user" ORDER BY id ASC LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found. Please create a user first.';
    END IF;

    -- Get widget type IDs
    SELECT id INTO v_widget_type_kpi FROM widget_types WHERE name = 'kpi';
    SELECT id INTO v_widget_type_line FROM widget_types WHERE name = 'line_chart';
    SELECT id INTO v_widget_type_donut FROM widget_types WHERE name = 'donut_chart';
    SELECT id INTO v_widget_type_map FROM widget_types WHERE name = 'map';

    -- Check if dashboard exists
    SELECT id INTO v_dashboard_id FROM dashboards WHERE name = 'Production Dashboard' AND created_by = v_user_id;

    IF v_dashboard_id IS NULL THEN
        -- Create dashboard
        INSERT INTO dashboards (name, description, created_by, grid_config)
        VALUES (
            'Production Dashboard',
            'Complete production monitoring',
            v_user_id,
            '{"cols": 12, "rowHeight": 100, "margin": [10, 10], "breakpoints": {"lg": 1200, "md": 996, "sm": 768, "xs": 480, "xxs": 0}, "containerPadding": [10, 10]}'::jsonb
        )
        RETURNING id INTO v_dashboard_id;

        RAISE NOTICE 'Created new dashboard with ID: %', v_dashboard_id;
    ELSE
        -- Clear existing layouts
        DELETE FROM dashboard_layouts WHERE dashboard_id = v_dashboard_id;
        RAISE NOTICE 'Using existing dashboard ID: % (cleared old layouts)', v_dashboard_id;
    END IF;

    -- Step 3: Create Widget Definitions and Layouts

    -- Widget 1: Oil Flow Rate Card
    INSERT INTO widget_definitions (name, description, widget_type_id, data_source_config, created_by)
    VALUES (
        'Oil Flow Rate Card',
        'Total Oil Flow Rate metric card',
        v_widget_type_kpi,
        '{"metric": "total_ofr", "unit": "l/min", "label": "Total OFR"}'::jsonb,
        v_user_id
    )
    RETURNING id INTO v_widget_def_id;

    INSERT INTO dashboard_layouts (dashboard_id, widget_definition_id, layout_config, display_order)
    VALUES (
        v_dashboard_id,
        v_widget_def_id,
        '{"x": 0, "y": 0, "w": 3, "h": 2, "minW": 2, "minH": 2}'::jsonb,
        1
    );

    -- Widget 2: Water Flow Rate Card
    INSERT INTO widget_definitions (name, description, widget_type_id, data_source_config, created_by)
    VALUES (
        'Water Flow Rate Card',
        'Total Water Flow Rate metric card',
        v_widget_type_kpi,
        '{"metric": "total_wfr", "unit": "l/min", "label": "Total WFR"}'::jsonb,
        v_user_id
    )
    RETURNING id INTO v_widget_def_id;

    INSERT INTO dashboard_layouts (dashboard_id, widget_definition_id, layout_config, display_order)
    VALUES (
        v_dashboard_id,
        v_widget_def_id,
        '{"x": 3, "y": 0, "w": 3, "h": 2, "minW": 2, "minH": 2}'::jsonb,
        2
    );

    -- Widget 3: Gas Flow Rate Card
    INSERT INTO widget_definitions (name, description, widget_type_id, data_source_config, created_by)
    VALUES (
        'Gas Flow Rate Card',
        'Total Gas Flow Rate metric card',
        v_widget_type_kpi,
        '{"metric": "total_gfr", "unit": "l/min", "label": "Total GFR"}'::jsonb,
        v_user_id
    )
    RETURNING id INTO v_widget_def_id;

    INSERT INTO dashboard_layouts (dashboard_id, widget_definition_id, layout_config, display_order)
    VALUES (
        v_dashboard_id,
        v_widget_def_id,
        '{"x": 6, "y": 0, "w": 3, "h": 2, "minW": 2, "minH": 2}'::jsonb,
        3
    );

    -- Widget 4: Last Refresh Time
    INSERT INTO widget_definitions (name, description, widget_type_id, data_source_config, created_by)
    VALUES (
        'Last Refresh Time',
        'Last data refresh timestamp',
        v_widget_type_kpi,
        '{"metric": "last_refresh", "label": "Last Refresh"}'::jsonb,
        v_user_id
    )
    RETURNING id INTO v_widget_def_id;

    INSERT INTO dashboard_layouts (dashboard_id, widget_definition_id, layout_config, display_order)
    VALUES (
        v_dashboard_id,
        v_widget_def_id,
        '{"x": 9, "y": 0, "w": 3, "h": 2, "minW": 2, "minH": 2}'::jsonb,
        4
    );

    -- Widget 5: OFR Trend Chart
    INSERT INTO widget_definitions (name, description, widget_type_id, data_source_config, created_by)
    VALUES (
        'OFR Trend Chart',
        'Oil Flow Rate trend',
        v_widget_type_line,
        '{"metric": "ofr", "timeRange": "dynamic", "yAxisLabel": "OFR (l/min)", "title": "Oil Flow Rate", "unit": "l/min"}'::jsonb,
        v_user_id
    )
    RETURNING id INTO v_widget_def_id;

    INSERT INTO dashboard_layouts (dashboard_id, widget_definition_id, layout_config, display_order)
    VALUES (
        v_dashboard_id,
        v_widget_def_id,
        '{"x": 0, "y": 2, "w": 6, "h": 4, "minW": 4, "minH": 3}'::jsonb,
        5
    );

    -- Widget 6: WFR Trend Chart
    INSERT INTO widget_definitions (name, description, widget_type_id, data_source_config, created_by)
    VALUES (
        'WFR Trend Chart',
        'Water Flow Rate trend',
        v_widget_type_line,
        '{"metric": "wfr", "timeRange": "dynamic", "yAxisLabel": "WFR (l/min)", "title": "Water Flow Rate", "unit": "l/min"}'::jsonb,
        v_user_id
    )
    RETURNING id INTO v_widget_def_id;

    INSERT INTO dashboard_layouts (dashboard_id, widget_definition_id, layout_config, display_order)
    VALUES (
        v_dashboard_id,
        v_widget_def_id,
        '{"x": 6, "y": 2, "w": 6, "h": 4, "minW": 4, "minH": 3}'::jsonb,
        6
    );

    -- Widget 7: GFR Trend Chart
    INSERT INTO widget_definitions (name, description, widget_type_id, data_source_config, created_by)
    VALUES (
        'GFR Trend Chart',
        'Gas Flow Rate trend',
        v_widget_type_line,
        '{"metric": "gfr", "timeRange": "dynamic", "yAxisLabel": "GFR (l/min)", "title": "Gas Flow Rate", "unit": "l/min"}'::jsonb,
        v_user_id
    )
    RETURNING id INTO v_widget_def_id;

    INSERT INTO dashboard_layouts (dashboard_id, widget_definition_id, layout_config, display_order)
    VALUES (
        v_dashboard_id,
        v_widget_def_id,
        '{"x": 0, "y": 6, "w": 12, "h": 4, "minW": 4, "minH": 3}'::jsonb,
        7
    );

    -- Widget 8: Production Fractions
    INSERT INTO widget_definitions (name, description, widget_type_id, data_source_config, created_by)
    VALUES (
        'Production Fractions',
        'Production fractions over time',
        v_widget_type_line,
        '{"metric": "fractions", "metrics": ["gor", "wlr"], "yAxisLabel": "Ratio", "title": "Production Fractions"}'::jsonb,
        v_user_id
    )
    RETURNING id INTO v_widget_def_id;

    INSERT INTO dashboard_layouts (dashboard_id, widget_definition_id, layout_config, display_order)
    VALUES (
        v_dashboard_id,
        v_widget_def_id,
        '{"x": 0, "y": 10, "w": 6, "h": 4, "minW": 4, "minH": 3}'::jsonb,
        8
    );

    -- Widget 9: GVF and WLR Gauges
    INSERT INTO widget_definitions (name, description, widget_type_id, data_source_config, created_by)
    VALUES (
        'GVF and WLR Gauges',
        'GVF and WLR percentage gauges',
        v_widget_type_donut,
        '{"metrics": ["gvf", "wlr"], "title": "GVF & WLR"}'::jsonb,
        v_user_id
    )
    RETURNING id INTO v_widget_def_id;

    INSERT INTO dashboard_layouts (dashboard_id, widget_definition_id, layout_config, display_order)
    VALUES (
        v_dashboard_id,
        v_widget_def_id,
        '{"x": 6, "y": 10, "w": 6, "h": 4, "minW": 4, "minH": 3}'::jsonb,
        9
    );

    -- Widget 10: Production Map View
    INSERT INTO widget_definitions (name, description, widget_type_id, data_source_config, created_by)
    VALUES (
        'Production Map View',
        'Geographic production map',
        v_widget_type_map,
        '{"showDevices": true, "showHierarchy": true, "clusterMarkers": true}'::jsonb,
        v_user_id
    )
    RETURNING id INTO v_widget_def_id;

    INSERT INTO dashboard_layouts (dashboard_id, widget_definition_id, layout_config, display_order)
    VALUES (
        v_dashboard_id,
        v_widget_def_id,
        '{"x": 0, "y": 14, "w": 12, "h": 6, "minW": 6, "minH": 4}'::jsonb,
        10
    );

    RAISE NOTICE '✅ Successfully seeded 10 widgets for dashboard: %', v_dashboard_id;
END $$;

-- Verification Query
SELECT
    d.name as dashboard_name,
    COUNT(dl.id) as widget_count
FROM dashboards d
LEFT JOIN dashboard_layouts dl ON d.id = dl.dashboard_id
WHERE d.name = 'Production Dashboard'
GROUP BY d.id, d.name;
