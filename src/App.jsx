import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom'
import AuthPage from './features/auth/AuthPage.jsx'
import DashboardPage from './features/dashboard/DashboardPage.jsx'
import { isAuthenticated } from './features/auth/authStorage.js'

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route
          path="/admin/login"
          element={
            <AuthPage
              mode="login"
              title="Admin Sign In"
              subtitle="Access the StaffLens admin workspace to manage records, monitor staff updates, and review operational insights."
            />
          }
        />
        <Route
          path="/admin/forgot-password"
          element={
            <AuthPage
              mode="forgot"
              title="Forgot Password"
              subtitle="Enter your administrator email address and we will prepare a reset link for secure account recovery."
            />
          }
        />
        <Route
          path="/admin/reset-password"
          element={
            <AuthPage
              mode="reset"
              title="Reset Password"
              subtitle="Set a fresh password for your admin account and return to the dashboard with updated credentials."
            />
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </Router>
  )
}
