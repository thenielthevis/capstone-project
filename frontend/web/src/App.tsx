import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import HealthAssessment from './pages/HealthAssessment';
import Predictions from './pages/Predictions';
import FoodTracking from './pages/FoodTracking';
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
    </Routes>
  );
}

export default App;
