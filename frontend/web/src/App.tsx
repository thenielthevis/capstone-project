import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import HealthAssessment from './pages/HealthAssessment';
import Predictions from './pages/Predictions';
import FoodTracking from './pages/FoodTracking';
import Programs from './pages/Programs';
import CreateProgram from './pages/CreateProgram';
import AutomatedProgram from './pages/AutomatedProgram';
import ProgramOverview from './pages/ProgramOverview';
import GroupProgram from './pages/GroupProgram';
import ProgramCoach from './pages/ProgramCoach';
import Settings from './pages/Settings';
import TermsAndConditions from './pages/TermsAndConditions';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import CreateAdmin from './pages/CreateAdmin';
import AdminFoodLogs from './pages/AdminFoodLogs';
import AdminGeoActivities from './pages/AdminGeoActivities';
import AdminWorkouts from './pages/AdminWorkouts';
import AdminPrograms from './pages/AdminPrograms';
import AdminAchievements from './pages/AdminAchievements';
import Feed from './pages/Feed';
import Chat from './pages/Chat';
import HealthAnalysis from './pages/HealthAnalysis';
import AnalysisDetail from './pages/AnalysisDetail';
import Profile from './pages/Profile';
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
        path="/feed"
        element={
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
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
        path="/analysis"
        element={
          <ProtectedRoute>
            <HealthAnalysis />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analysis/:metricId"
        element={
          <ProtectedRoute>
            <AnalysisDetail />
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
        path="/programs"
        element={
          <ProtectedRoute>
            <Programs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/programs/create"
        element={
          <ProtectedRoute>
            <CreateProgram />
          </ProtectedRoute>
        }
      />
      <Route
        path="/programs/automated"
        element={
          <ProtectedRoute>
            <AutomatedProgram />
          </ProtectedRoute>
        }
      />
      <Route
        path="/programs/overview/:id"
        element={
          <ProtectedRoute>
            <ProgramOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/programs/group"
        element={
          <ProtectedRoute>
            <GroupProgram />
          </ProtectedRoute>
        }
      />
      <Route
        path="/programs/coach/:id"
        element={
          <ProtectedRoute>
            <ProgramCoach />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/create-admin"
        element={
          <ProtectedRoute>
            <CreateAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/foodlogs"
        element={
          <ProtectedRoute>
            <AdminFoodLogs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/geo-activities"
        element={
          <ProtectedRoute>
            <AdminGeoActivities />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/workouts"
        element={
          <ProtectedRoute>
            <AdminWorkouts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/programs"
        element={
          <ProtectedRoute>
            <AdminPrograms />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/achievements"
        element={
          <ProtectedRoute>
            <AdminAchievements />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
