# Lifora Web Authentication System

Complete login and registration implementation for the Lifora web application, mirroring the mobile app's authentication functionality.

## 🚀 Quick Start

1. **Setup Environment**
   ```bash
   cd frontend/web
   cp .env.example .env
   # Edit .env and set VITE_API_URL to your backend URL
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Landing Page: http://localhost:5173/
   - Login: http://localhost:5173/login
   - Register: http://localhost:5173/register
   - Dashboard: http://localhost:5173/dashboard (protected)

## 📁 New Files Created

### Pages
- `src/pages/Login.tsx` - Login page with email/password authentication
- `src/pages/Register.tsx` - Registration page with form validation
- `src/pages/Dashboard.tsx` - Protected dashboard for authenticated users

### Context
- `src/context/AuthContext.tsx` - Global authentication state management

### Components
- `src/components/ProtectedRoute.tsx` - Route wrapper for authentication protection

### Utilities
- `src/utils/auth.ts` - Authentication helper functions and API calls

### Configuration
- `.env.example` - Environment variable template
- `AUTH_README.md` - Detailed authentication documentation
- `IMPLEMENTATION_SUMMARY.md` - Complete implementation details

## 🎨 Features

### Login Page
✅ Email and password authentication
✅ Password visibility toggle
✅ Form validation (email format, password length)
✅ Error handling with user-friendly messages
✅ Loading states with spinner animation
✅ Google Sign-In button (UI ready)
✅ Links to registration and password recovery
✅ Responsive gradient background
✅ Smooth navigation

### Register Page
✅ Username, email, password, and confirm password fields
✅ Individual password visibility toggles
✅ Comprehensive form validation
✅ Google Sign-In at top (matching mobile layout)
✅ Error display with context
✅ Loading states
✅ Link to login page
✅ Success redirect to login

### Dashboard Page
✅ Protected route (auto-redirect if not authenticated)
✅ User profile display with avatar
✅ Logout functionality
✅ Quick action cards
✅ Responsive design

### Authentication Context
✅ Global state management
✅ Automatic initialization from localStorage
✅ Login/logout methods
✅ User and token management
✅ Loading states
✅ TypeScript support

### Protected Routes
✅ Automatic authentication checking
✅ Redirect to login if not authenticated
✅ Loading state during initialization
✅ Clean component wrapper

## 🔐 Security Features

- ✅ Client-side form validation
- ✅ Password visibility toggles
- ✅ Token-based authentication
- ✅ Protected routes with auto-redirect
- ✅ Secure token storage
- ✅ Authorization headers
- ✅ Input sanitization
- ✅ Error handling

## 🎯 API Integration

### Backend Endpoints Required

```typescript
// Login
POST /api/users/login
Body: { email: string, password: string }
Response: { token: string, user: User }

// Register
POST /api/users/register
Body: { username: string, email: string, password: string }
Response: { message: string }

// Google OAuth (Future)
POST /api/users/google
Body: { username: string, email: string, googleId: string, profilePicture?: string }
Response: { token: string, user: User }
```

### Environment Configuration

Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

## 📱 Mobile Parity

The web implementation matches the mobile app's features:

| Feature | Mobile | Web |
|---------|--------|-----|
| Email/Password Auth | ✅ | ✅ |
| User Registration | ✅ | ✅ |
| Form Validation | ✅ | ✅ |
| Password Toggles | ✅ | ✅ |
| Google Sign-In UI | ✅ | ✅ |
| Error Handling | ✅ | ✅ |
| Loading States | ✅ | ✅ |
| Protected Routes | ✅ | ✅ |
| Context/State Management | ✅ | ✅ |
| Token Storage | ✅ | ✅ |

## 🛠️ Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **React Router DOM v7** - Routing
- **Tailwind CSS v4** - Styling
- **Lucide React** - Icons
- **Vite** - Build tool
- **Context API** - State management

## 📝 Usage Examples

### Using Auth Context

```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <p>Welcome, {user?.username}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Creating Protected Routes

```typescript
import ProtectedRoute from '@/components/ProtectedRoute';

<Route 
  path="/protected" 
  element={
    <ProtectedRoute>
      <MyProtectedComponent />
    </ProtectedRoute>
  } 
/>
```

### Using Auth Utilities

```typescript
import { loginUser, isValidEmail, getAuthHeader } from '@/utils/auth';

// Validate email
if (!isValidEmail(email)) {
  // Handle error
}

// Login
const { user, token } = await loginUser({ email, password });

// Make authenticated API call
const headers = getAuthHeader();
fetch('/api/protected', { headers });
```

## 🚧 Future Enhancements

### Phase 1 - OAuth Integration
- [ ] Implement Google OAuth for web
- [ ] Add Facebook login
- [ ] Add Apple Sign-In

### Phase 2 - Security
- [ ] JWT token refresh mechanism
- [ ] Session timeout handling
- [ ] Two-factor authentication
- [ ] Email verification

### Phase 3 - User Experience
- [ ] Remember me functionality
- [ ] Password recovery flow
- [ ] Password strength indicator
- [ ] Real-time validation feedback

### Phase 4 - Dashboard Features
- [ ] Profile editing
- [ ] Settings page
- [ ] Wellness tracking
- [ ] AI insights
- [ ] Community features

## 🧪 Testing

### Manual Testing Checklist

- [ ] Register new user with valid data
- [ ] Try registering with existing email (should fail)
- [ ] Validate form errors on invalid input
- [ ] Login with correct credentials
- [ ] Try login with wrong credentials (should fail)
- [ ] Verify redirect to dashboard after login
- [ ] Check user info displays on dashboard
- [ ] Test logout functionality
- [ ] Try accessing dashboard without auth (should redirect to login)
- [ ] Test password visibility toggles
- [ ] Verify responsive design on mobile/tablet
- [ ] Check all navigation links
- [ ] Test loading states during API calls

### Test User Creation

```bash
# Example using curl
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"test123"}'
```

## 🐛 Troubleshooting

### Issue: API Connection Failed
**Solution:** 
- Check `VITE_API_URL` in `.env`
- Ensure backend server is running
- Verify CORS is enabled on backend

### Issue: Token Not Persisting
**Solution:**
- Check browser localStorage
- Verify AuthContext is wrapping App
- Check browser console for errors

### Issue: Redirect Loop
**Solution:**
- Clear localStorage
- Check protected route logic
- Verify token validity

### Issue: Build Errors
**Solution:**
- Run `npm install`
- Delete `node_modules` and reinstall
- Check TypeScript errors with `npm run lint`

## 📚 Additional Resources

- [React Router Documentation](https://reactrouter.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Lucide Icons](https://lucide.dev/)

## 🤝 Contributing

When adding new features:

1. Maintain consistency with mobile app
2. Follow TypeScript best practices
3. Add proper error handling
4. Update documentation
5. Test thoroughly on all screen sizes

## 📄 License

Part of the Lifora Capstone Project.

---

**Note:** This implementation provides the foundation for authentication. The Google OAuth integration is UI-ready but requires additional setup with OAuth providers. The dashboard is a placeholder for future wellness tracking features.
