# Web Authentication Setup

This document describes the login and registration system for the Lifora web application, mirroring the mobile app's authentication flow.

## Features

### Login Page (`/login`)
- Email and password authentication
- Password visibility toggle
- Form validation (email format, password length)
- Google Sign-In integration (placeholder for future implementation)
- Error handling and display
- Loading states during authentication
- Links to registration and password recovery
- Responsive design matching mobile app's aesthetic

### Register Page (`/register`)
- User registration with username, email, and password
- Password confirmation with visibility toggles
- Form validation:
  - Username required
  - Email format validation
  - Password minimum 6 characters
  - Passwords must match
- Google Sign-In integration (placeholder)
- Error handling and display
- Loading states during registration
- Link to login page
- Responsive design

### Dashboard Page (`/dashboard`)
- Protected route (redirects to login if not authenticated)
- Displays user information
- Logout functionality
- Placeholder for future wellness features
- Quick action cards for upcoming features

## Setup

### 1. Environment Variables

Create a `.env` file in the `frontend/web` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

Copy from `.env.example` if needed:
```bash
cp .env.example .env
```

### 2. Backend API

The authentication system expects the following API endpoints:

#### Login
```
POST /api/users/login
Body: { email: string, password: string }
Response: { token: string, user: { username: string, email: string, ... } }
```

#### Register
```
POST /api/users/register
Body: { username: string, email: string, password: string }
Response: { message: string }
```

#### Google OAuth (Future)
```
POST /api/users/google
Body: { username: string, email: string, googleId: string, profilePicture?: string }
Response: { token: string, user: { ... } }
```

### 3. Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Routes

- `/` - Landing page
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - User dashboard (protected route)

## Storage

The application uses `localStorage` for client-side storage:

- `token` - JWT authentication token
- `user` - User information (JSON stringified)

## Design Consistency

The web authentication pages maintain visual consistency with the mobile app:

- Similar color scheme (blue primary color)
- Matching form layouts
- Consistent button styles
- Same validation rules
- Identical user experience flow

## Security Features

- Client-side form validation
- Password visibility toggles
- Error messages for invalid inputs
- Protected routes (redirect to login if not authenticated)
- Token-based authentication
- Secure password handling (minimum 6 characters)

## Future Enhancements

1. **Google OAuth Integration**
   - Web-based Google Sign-In
   - Firebase Authentication integration
   - OAuth token handling

2. **Password Recovery**
   - Forgot password functionality
   - Email verification
   - Password reset flow

3. **Enhanced Validation**
   - Real-time validation feedback
   - Password strength indicator
   - Username availability check

4. **Remember Me**
   - Optional persistent login
   - Secure token refresh

5. **Email Verification**
   - Account activation via email
   - Resend verification email

## Components Used

- **UI Components**: Button, Card (from `@/components/ui`)
- **Icons**: lucide-react (Eye, EyeOff, Mail, Lock, User, Activity)
- **Routing**: react-router-dom
- **Styling**: Tailwind CSS

## Mobile Parity

The web authentication system mirrors the mobile app's features:

✅ Email/password login
✅ User registration
✅ Form validation
✅ Error handling
✅ Loading states
✅ Password visibility toggles
✅ Google Sign-In (placeholder)
✅ Similar UI/UX design
✅ Protected dashboard route

## Troubleshooting

### API Connection Issues
- Verify `VITE_API_URL` in `.env` file
- Ensure backend server is running
- Check CORS configuration on backend

### Authentication Not Persisting
- Check browser's localStorage
- Verify token is being saved
- Check token expiration

### Routing Issues
- Ensure react-router-dom is installed
- Verify BrowserRouter is wrapping the App component

## Testing

To test the authentication flow:

1. Start the backend server
2. Start the web development server
3. Navigate to `/register` and create an account
4. Login with the created credentials at `/login`
5. Verify redirect to `/dashboard` on successful login
6. Test logout functionality
7. Verify redirect to `/login` when accessing `/dashboard` without authentication
