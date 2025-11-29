# Task Wave 🌊

A comprehensive, production-ready Project Management System built with Next.js, TypeScript (TSX), and Supabase.

**Ride the wave of productivity with seamless task and project management.**

## Features

- 🔐 **Authentication**: Supabase Auth with email/password
- 📊 **Excel-style Task Grid**: TanStack Table with inline editing
- 💾 **Auto-save**: Debounced auto-save every 500ms
- 🔄 **Real-time Sync**: Multi-user collaboration with Supabase Realtime
- 🎯 **Project Management**: Multi-project with stakeholders
- 👥 **Team Structure**: Departments and team members
- 🎨 **Modern UI**: TailwindCSS + shadcn/ui components
- 🔒 **Role-Based Access**: Admin and Project Manager roles
- 📱 **Responsive**: Optimized for desktop and tablet
- ⚡ **Performance**: Auto-calculated based on dates

## Setup Instructions

### 1. Database Setup

1. Go to your Supabase project: https://jnmrhminhdzusshspqrt.supabase.co
2. Navigate to SQL Editor
3. Run the SQL script from `database_schema.sql`
4. This will create all necessary tables, indexes, RLS policies, and triggers

### 2. Create Admin User

1. In Supabase Dashboard, go to Authentication > Users
2. Click "Add User" and create an admin account
3. Copy the user UUID
4. In SQL Editor, run:
```sql
INSERT INTO public.user_profiles (id, email, full_name, role) 
VALUES ('your-user-uuid', 'admin@example.com', 'Admin Name', 'admin');
```

### 3. Install Dependencies

```bash
yarn install
```

### 4. Run Development Server

```bash
yarn dev
```

The app will be available at http://localhost:3000

## User Roles

- **Admin**: Full access to all features, can manage projects, departments, teams, and tasks
- **Project Manager**: Can create and manage tasks within assigned projects
- **Team Member**: View tasks assigned to them, update status and completion

## Task Grid Columns

1. Task Description
2. Assigned By (Stakeholder)
3. Priority (Low/Medium/High/Critical)
4. Assigned Date
5. ETA
6. Department (Multi-select)
7. Assigned To (Multi-select)
8. Assigned by PM (Yes/No)
9. Status (Yet To Start/In Progress/On Hold/Client Review Pending/Completed)
10. Require QA (Yes/No)
11. Completed Date
12. Performance (Auto-calculated: Before Time/On Time/Delayed)
13. Notes

## Row Colors by Status

- Yet To Start: #f7f7f7 (Light gray)
- In Progress: #fff6e5 (Light yellow)
- On Hold: #fdecec (Light red)
- Client Review Pending: #e8f3ff (Light blue)
- Completed: #e9f9ec (Light green)

## Architecture

- **Frontend**: Next.js 14 with React TSX components
- **Backend**: Supabase (Postgres + Auth + Realtime)
- **State Management**: Zustand
- **Table Grid**: TanStack Table
- **Styling**: TailwindCSS + shadcn/ui
- **Forms**: React Hook Form + Zod validation

## Key Features

### Auto-save
Every cell edit triggers a debounced save after 500ms of inactivity.

### Real-time Collaboration
Multiple users can work on tasks simultaneously with real-time updates.

### Multi-select Dependencies
"Assigned To" dropdown filters team members based on selected departments.

### Performance Calculation
Automatically calculated based on completed date vs ETA:
- Before Time: Completed < ETA
- On Time: Completed = ETA
- Delayed: Completed > ETA

## License

MIT
