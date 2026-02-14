# Uazapi Dashboard

## Overview
A premium dashboard for managing WhatsApp Business connections via Uazapi.

## Setup

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Verified in `.env.local`.

3.  **Database Setup (Supabase)**:
    - Go to your Supabase Dashboard -> SQL Editor.
    - Run the script `SUPABASE_SCHEMA.sql` located in this directory.
    - This will create the necessary tables and RLS policies.

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

5.  **Admin Access**:
    - Sign up a new user via the app.
    - In Supabase -> Table Editor -> `profiles`, change the `role` of your user to `admin`.
    - Refresh the dashboard to see all connections.

## Features
- **Authentication**: Email/Password Sign Up & Sign In.
- **Connections**: Create, List, Delete Uazapi instances.
- **Security**: Row Level Security (RLS) ensures users only see their own data (unless Admin).
- **Responsive**: Mobile-first design.
