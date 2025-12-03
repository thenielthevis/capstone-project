# Admin Setup Guide

## Creating Admin Users

### Option 1: Using the Seed Script (First Admin)

To create the first admin user in the database, run:

```bash
cd backend
node createAdminUser.js
```

This will create an admin account with:
- **Email:** admin@lifora.com
- **Password:** admin123456
- **Username:** admin

**⚠️ IMPORTANT:** Change the admin password immediately after first login!

### Option 2: Using the Admin Dashboard (Creating Additional Admins)

1. Log in with an existing admin account
2. Navigate to `/admin/dashboard`
3. Click "Create Admin" or go to `/admin/create-admin`
4. Fill in the form and submit
5. The new admin account will be created in the database

## Admin Features

### Admin Dashboard (`/admin/dashboard`)
- View dashboard statistics (total users, admin accounts, etc.)
- Quick action buttons for common tasks
- User management interface (coming soon)

### Create Admin (`/admin/create-admin`)
- Create new admin accounts
- Requires admin privileges

### User Management
- View all users with pagination
- Filter by role
- Delete users
- View user details

## Role-Based Access Control

The system uses role-based access control with two roles:

- **User** (default): Regular users with access to health assessment and predictions
- **Admin**: Administrative users with access to dashboard, user management, etc.

### Protected Routes

- `/admin/dashboard` - Requires `admin` role
- `/admin/create-admin` - Requires `admin` role
- `/admin/users` - Requires `admin` role (coming soon)

### Redirects

- If a user tries to access an admin route without the `admin` role, they are redirected to `/dashboard`
- If an unauthenticated user tries to access any protected route, they are redirected to `/login`

## Database Schema

The User model includes a `role` field with enum values:
- `'user'` (default)
- `'admin'`

```javascript
role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
}
```

## API Endpoints

### Admin Endpoints (All require admin authentication)

- `GET //admin/stats` - Get dashboard statistics
- `POST /api/admin/create-admin` - Create new admin user
- `GET /api/admin/users` - Get all users (with pagination and filtering)
- `GET /api/admin/users/:userId` - Get user by ID
- `DELETE /api/admin/users/:userId` - Delete user

## Security Notes

1. All admin routes are protected by the `adminMiddleware` which verifies:
   - A valid JWT token is provided
   - The token's role is set to 'admin'

2. Admin credentials should be kept secure

3. The seed script creates a default admin account - change the password immediately

4. Consider implementing:
   - Password change functionality
   - Admin activity logging
   - Role-based permissions for different admin functions
   - Two-factor authentication for admin accounts
