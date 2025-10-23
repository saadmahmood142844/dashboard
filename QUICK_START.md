# Quick Start Guide - Dashboard Widget System

## What Changed

Your dashboard now loads all widgets (KPI cards, charts, maps) from the PostgreSQL database instead of being hardcoded. The UI remains exactly the same - same appearance, same functionality.

## Setup Steps

### 1. Ensure Database is Running

```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# Start if needed
sudo systemctl start postgresql  # Linux
# OR
brew services start postgresql   # macOS
```

### 2. Seed Widget Types (First Time Only)

```bash
cd backend
npm run seed:widgets
```

This creates all widget type definitions in the database.

### 3. Seed Default Dashboard (First Time Only)

```bash
cd backend
npm run seed:dashboard
```

This creates the default dashboard with all 10 widgets:
- 4 KPI Cards (OFR, WFR, GFR, Last Refresh)
- 4 Line Charts (OFR, WFR, GFR, Fractions)
- 1 Pie Chart (Top Regions)
- 1 Map Widget (Production Map)

### 4. Start the Application

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Verify

- Open the dashboard in your browser
- Look for a small green badge showing "{X} widgets loaded"
- All widgets should display in their normal positions
- Everything should work exactly as before

## What to Expect

### On Dashboard Load
- You'll see "Loading dashboard..." briefly
- Then a green badge appears showing the number of widgets loaded
- All widgets render in their normal positions

### Database Tables Used
- `widget_types` - Stores widget type definitions
- `widget_definitions` - Stores widget configurations
- `dashboards` - Stores dashboard metadata
- `dashboard_layouts` - Stores widget positions and order

## Troubleshooting

### Database Not Running
```bash
# Start PostgreSQL
sudo systemctl start postgresql
```

### Seeding Fails
```bash
# Check database exists
psql -U postgres -l | grep saher-dashboard

# Create if missing
psql -U postgres -c 'CREATE DATABASE "saher-dashboard";'
```

### Widgets Not Loading
- Check browser console for API errors
- Verify backend is running on port 5000
- Check `backend/.env` has correct `DATABASE_URL`

### No Widget Badge Showing
- Database might not be seeded
- Run seed scripts again
- Check browser console for errors

## Backend API Endpoints

```bash
# Get user dashboards
GET /api/dashboards

# Get dashboard widgets
GET /api/dashboard-layouts/dashboard/:dashboardId
```

Both require authentication token in header:
```
Authorization: Bearer <your-token>
```

## Files Modified

### Backend
- `package.json` - Added seed scripts
- `scripts/seedDefaultDashboard.js` - New seeding script

### Frontend
- `services/api.ts` - Added dashboard API methods
- `components/Dashboard/DashboardContent.tsx` - Loads widgets from DB
- `components/Dashboard/WidgetRenderer.tsx` - New widget renderer

## Next Steps

Now that widgets are database-driven, you can:
1. Create multiple dashboards per user
2. Allow users to customize widget layouts
3. Add drag-and-drop functionality
4. Create new widget types dynamically

---

**Note**: The dashboard still works the same way it did before. The only difference is that widget configurations are now stored in and loaded from the database, making the system more flexible and maintainable.
