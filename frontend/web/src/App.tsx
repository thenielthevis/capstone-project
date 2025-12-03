import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import HealthAssessment from './pages/HealthAssessment';
import Predictions from './pages/Predictions';
import FoodTracking from './pages/FoodTracking';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import CreateAdmin from './pages/CreateAdmin';
import GeoActivities from './pages/GeoActivities';
import GeoActivityForm from './pages/GeoActivityForm';
import Workouts from './pages/Workouts';
import WorkoutForm from './pages/WorkoutForm';
import Programs from './pages/Programs';
import FoodLogs from './pages/FoodLogs';
import TermsAndConditions from './pages/TermsAndConditions';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/terms" element={<TermsAndConditions />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/health-assessment"
        element={
          <ProtectedRoute>
            <HealthAssessment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/predictions"
        element={
          <ProtectedRoute>
            <Predictions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/food-tracking"
        element={
          <ProtectedRoute>
            <FoodTracking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/create-admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <CreateAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/geo-activities"
        element={
          <ProtectedRoute requiredRole="admin">
            <GeoActivities />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/geo-activities/create"
        element={
          <ProtectedRoute requiredRole="admin">
            <GeoActivityForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/geo-activities/edit/:id"
        element={
          <ProtectedRoute requiredRole="admin">
            <GeoActivityForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/workouts"
        element={
          <ProtectedRoute requiredRole="admin">
            <Workouts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/workouts/create"
        element={
          <ProtectedRoute requiredRole="admin">
            <WorkoutForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/workouts/edit/:id"
        element={
          <ProtectedRoute requiredRole="admin">
            <WorkoutForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/programs"
        element={
          <ProtectedRoute requiredRole="admin">
            <Programs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/foodlogs"
        element={
          <ProtectedRoute requiredRole="admin">
            <FoodLogs />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
