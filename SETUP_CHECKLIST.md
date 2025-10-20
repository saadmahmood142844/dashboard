# Widget System Setup Checklist

## Pre-Setup Requirements

- [ ] PostgreSQL database running
- [ ] Node.js installed (v14+)
- [ ] Backend dependencies installed (`npm install` in backend/)
- [ ] Database connection configured in `.env`
- [ ] JWT_SECRET configured in `.env`
- [ ] User table exists (run main backend migrations first)

## Backend Setup

### Step 1: Environment Configuration
- [ ] Copy `backend/.env.example` to `backend/.env`
- [ ] Update `DATABASE_URL` with your PostgreSQL credentials
- [ ] Update `JWT_SECRET` with a secure random string
- [ ] Update `CLIENT_URL` with your frontend URL

### Step 2: Database Setup
Choose one of the following methods:

#### Method A: Automatic Setup (Recommended)
- [ ] Run: `node backend/scripts/setupWidgetSystem.js`
- [ ] Verify success message appears
- [ ] Check database for new tables

#### Method B: Manual Setup
- [ ] Run migration: `psql -U user -d db -f backend/migrations/001_create_widget_system.sql`
- [ ] Run seed: `node backend/scripts/seedWidgets.js`
- [ ] Verify 12 widget types were created

### Step 3: Verify Installation
- [ ] Run: `node -c backend/server.js` (should show no errors)
- [ ] Start server: `npm start` or `node backend/server.js`
- [ ] Check console for "Server is running on port 5000"
- [ ] Check for new routes in startup logs

### Step 4: Test APIs
- [ ] Import Postman collection: `backend/postman/10_Widget_System.postman_collection.json`
- [ ] Get authentication token (login)
- [ ] Set token in collection variables
- [ ] Test: GET /api/widget-types (should return 12 types)
- [ ] Test: POST /api/widget-definitions (create a widget)
- [ ] Test: POST /api/dashboards (create a dashboard)
- [ ] Test: GET /api/dashboards/:id (view dashboard with layouts)

## Database Verification

Run these queries to verify tables were created:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'widget_types',
    'widget_definitions',
    'dashboards',
    'dashboard_layouts',
    'dashboard_shares'
  );

-- Check widget types were seeded
SELECT COUNT(*) FROM widget_types;
-- Should return 12

-- List widget types
SELECT name, component_name FROM widget_types ORDER BY name;
```

## Frontend Setup

### Step 1: Install Dependencies
- [ ] Run: `npm install react-grid-layout`
- [ ] Install types: `npm install --save-dev @types/react-grid-layout`

### Step 2: API Integration
- [ ] Add widget endpoints to your API service
- [ ] Test fetching widget types
- [ ] Test creating widget definitions
- [ ] Test loading dashboards

### Step 3: Create Components
- [ ] Create DashboardView component
- [ ] Create widget components (gauge, chart, etc.)
- [ ] Create widget selector component
- [ ] Create dashboard manager component

### Step 4: Test Integration
- [ ] Load a dashboard from backend
- [ ] Render widgets in grid layout
- [ ] Test drag & drop functionality
- [ ] Test saving layout changes

## Troubleshooting

### Database Connection Issues
If you see "Database connection error":
- [ ] Verify PostgreSQL is running
- [ ] Check DATABASE_URL format: `postgresql://user:pass@host:5432/db`
- [ ] Test connection: `psql -U user -d db -c "SELECT 1"`
- [ ] Check firewall/network settings

### Migration Issues
If migration fails:
- [ ] Check uuid-ossp extension: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
- [ ] Verify user table exists
- [ ] Check for syntax errors in SQL
- [ ] Check PostgreSQL version (9.5+)

### Seed Issues
If seeding fails:
- [ ] Verify migration completed successfully
- [ ] Check database connection
- [ ] Look for duplicate widget type names
- [ ] Review console error messages

### API Issues
If endpoints return 404:
- [ ] Verify routes are registered in server.js
- [ ] Check console logs for errors
- [ ] Verify all model files exist
- [ ] Test with: `curl http://localhost:5000/api/health`

### Authentication Issues
If getting 401 errors:
- [ ] Verify JWT token is valid
- [ ] Check Authorization header format: `Bearer <token>`
- [ ] Verify JWT_SECRET matches between login and validation
- [ ] Check token expiration

### Permission Issues
If getting 403 errors:
- [ ] Verify user owns the resource
- [ ] Check dashboard sharing permissions
- [ ] Verify user role (admin required for some endpoints)
- [ ] Check database share records

## Verification Commands

### Backend Health Check
```bash
curl http://localhost:5000/api/health
```

### Widget Types Check
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/widget-types
```

### Server Syntax Check
```bash
cd backend
node -c server.js
node -c routes/widgetTypes.js
node -c routes/widgetDefinitions.js
node -c routes/dashboards.js
node -c routes/dashboardLayouts.js
```

### Database Check
```bash
psql -U user -d database -c "SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'widget%' OR table_name LIKE 'dashboard%';"
```

## Success Criteria

You'll know everything is working when:
- [x] Server starts without errors
- [x] All 12 widget types appear in GET /api/widget-types
- [x] You can create widget definitions
- [x] You can create dashboards with widgets
- [x] You can update widget positions
- [x] Postman tests all pass
- [x] Frontend can load and display dashboards

## Files to Review

- [ ] `WIDGET_SYSTEM_SUMMARY.md` - Complete overview
- [ ] `backend/WIDGET_SYSTEM_SETUP.md` - Detailed backend setup
- [ ] `FRONTEND_INTEGRATION.md` - Frontend integration guide
- [ ] `backend/API_QUICK_REFERENCE.md` - API documentation
- [ ] `backend/postman/10_Widget_System.postman_collection.json` - API tests

## Next Steps After Setup

1. **Backend**
   - [ ] Add custom widget types if needed
   - [ ] Implement dashboard templates
   - [ ] Set up audit logging
   - [ ] Configure backup system

2. **Frontend**
   - [ ] Build widget components
   - [ ] Implement dashboard editor UI
   - [ ] Add widget configuration modals
   - [ ] Create sharing UI

3. **Testing**
   - [ ] Write unit tests
   - [ ] Add integration tests
   - [ ] Test permission scenarios
   - [ ] Load test with multiple users

4. **Deployment**
   - [ ] Set up production database
   - [ ] Configure environment variables
   - [ ] Set up SSL/HTTPS
   - [ ] Configure CORS properly

## Support Resources

- Database Schema: `backend/migrations/001_create_widget_system.sql`
- Models: `backend/models/Widget*.js`, `backend/models/Dashboard*.js`
- Routes: `backend/routes/widget*.js`, `backend/routes/dashboard*.js`
- Seed Data: `backend/scripts/seedWidgets.js`

## Getting Help

If you encounter issues:
1. Check the troubleshooting section above
2. Review error messages in console
3. Check PostgreSQL logs
4. Verify all checklist items are complete
5. Test individual components (models, routes) separately

---

**Estimated Setup Time**: 15-30 minutes
**Difficulty**: Intermediate
**Prerequisites**: Working PostgreSQL database, existing backend with user authentication
